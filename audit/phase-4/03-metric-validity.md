# BenchForge Phase 4 — Metric Validity and Trustworthiness Audit

**Audit Date:** 2026-10-17  
**Scope:** Performance metric definitions, calculation formulas, precision, unit consistency, and mathematical validity.  
**Auditor:** Independent Senior Performance & Systems Auditor (Phase 4)

---

## 1. Executive Summary

A performance benchmark is only as trustworthy as the mathematical rigor of its measurement pipeline. If metrics suffer from integer rounding, survivorship bias, unit mismatches, or fabricated scaling factors, the resulting throughput and latency numbers cannot be used to evaluate trading engine quality or make engineering decisions.

This audit evaluated every performance metric computed and displayed by BenchForge. We verified that **BenchForge's performance metrics are fundamentally untrustworthy**, compromised by a 1-millisecond integer quantization defect (BF-P4-001), artificial tail latency warping (BF-P4-008), integer duration truncation (BF-P2-004), and hardcoded replay throughput formulas (BF-P2-005).

---

## 2. Metric Trustworthiness & Definition Matrix

| Metric Name | Claimed Purpose | Implementation Location | Calculation Method | Trustworthiness Status | Primary Defect |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Throughput (TPS)** | Orders processed per second | `bot-worker/cmd/worker/main.go:316` | `float64(completedJobs) / duration.Seconds()` | **Partially Trustworthy** | Accurate in worker logs; corrupted when persisted to DB via integer truncation (BF-P2-004). |
| **P50 Latency** | Median order response time | `bot-worker/cmd/worker/percentiles.go:18-28` | 1ms integer bucket histogram (`math.Round`) | **UNTRUSTWORTHY (BF-P4-001)** | Truncates all latencies < 500µs to **0.0 ms**. High-frequency engines report 0ms. |
| **P90 / P99 Latency** | Tail response time | `bot-worker/cmd/worker/percentiles.go:30-47` | 1ms integer bucket histogram | **UNTRUSTWORTHY (BF-P4-001 / BF-P4-008)** | Quantized to integer ms; corrupted by arbitrary 5000ms penalty for failed requests. |
| **Replay Bucket TPS** | Time-series throughput graph | `telemetry-service/internal/aggregator/replay_worker.go:126` | `tps := count * 2` | **FABRICATED (BF-P2-005)** | Throughput is unconditionally multiplied by 2 regardless of actual elapsed time. |
| **Replay P99 Latency** | Time-series latency graph | `telemetry-service/internal/aggregator/replay_worker.go:89` | PostgreSQL `PERCENTILE_CONT(0.99)` | **UNTRUSTWORTHY (BF-P2-003)** | Computes percentiles on raw nanoseconds (displays 15,000,000 instead of 15ms). |
| **Concurrency Score** | Thread safety metric | `benchmark-service/internal/repository/leaderboard.go:118` | `(tracerSuccess / tracerTotal) * 100` | **UNTRUSTWORTHY (BF-P2-007)** | Workloads with 0 tracers automatically receive a default **100.0%** score. |
| **Correctness Score** | Matching validation rate | `services/bot-worker/internal/workers/pool.go:212` | `resp.StatusCode >= 200 && < 300` | **UNTRUSTWORTHY (BF-P2-001)** | Checks HTTP status code only; dummy engines returning empty 200 OK get 100%. |

---

## 3. Deep Dive: Metric Calculation Defects

### 3.1 BF-P4-001: Sub-Millisecond Histogram Quantization Defect

#### Implementation Analysis
In `services/bot-worker/cmd/worker/percentiles.go`:
```go
type LatencyHistogram struct {
    buckets []int
    total   int
}

func (h *LatencyHistogram) Add(latencyMs float64) {
    bucket := int(math.Round(latencyMs)) // <-- TRUNCATION DEFECT!
    if bucket < 0 { bucket = 0 }
    if bucket >= len(h.buckets) { bucket = len(h.buckets) - 1 }
    h.buckets[bucket]++
    h.total++
}
```

#### Why This Invalidates Trading Engine Benchmarks
1. Modern high-performance matching engines written in C++, Rust, or Go measure order turnaround latencies in **microseconds** (e.g., 80µs to 450µs).
2. BenchForge's marketing prominently advertises *"Microsecond Latency Tracking"*.
3. However, before inserting into `LatencyHistogram`, `main.go:295` converts durations to milliseconds: `result.Latency.Seconds() * 1000`.
4. `math.Round()` then rounds any latency below 0.5ms (500 microseconds) down to **0**:
   - 150 µs (0.15ms) $\to$ `bucket[0]` (0 ms)
   - 290 µs (0.29ms) $\to$ `bucket[0]` (0 ms)
   - 480 µs (0.48ms) $\to$ `bucket[0]` (0 ms)
5. When computing P50 or P99, `Percentile()` iterates buckets and returns `float64(i)`. Because all requests fall into bucket 0, BenchForge reports **P50 = 0.0 ms, P99 = 0.0 ms**!
6. **Empirical Verification (`metric_histogram_test.go`)**:
   - Ground Truth: P50 = 290.0 µs, P99 = 440.0 µs.
   - BenchForge Histogram: P50 = 0.0 ms, P99 = 0.0 ms (100% quantization error).
   - A fast engine taking 10µs and a slow engine taking 490µs receive the exact same 0.0ms rating!

---

### 3.2 BF-P4-008: Tail Latency Corruption via 5000ms Failure Penalty

#### Implementation Analysis
In `services/bot-worker/cmd/worker/main.go:292-296`:
```go
for result := range results {
    if !result.Success {
        hist.Add(5000.0) // Heavily penalize failed requests to avoid survivorship bias
    } else {
        hist.Add(result.Latency.Seconds() * 1000)
    }
    completedJobs++
    ...
```

#### The Statistical Flaw
- The author attempted to prevent survivorship bias (where dropped requests are ignored) by injecting a hardcoded **5,000.0 millisecond (5-second)** synthetic latency into the histogram.
- However, inserting an arbitrary outlier value completely corrupts the statistical distribution:
  - If a system processes 1,000 requests, where 980 succeed at 2.5ms and 20 fail (a 2% failure rate due to a full queue), the top 2% of the distribution are all set to 5,000ms.
  - The true P99 of the responsive engine should be ~3ms with a 98% availability flag.
  - BenchForge instead reports **P99 = 5,000.0 ms**!
- Latency and availability are two independent dimensions. Mixing arbitrary synthetic timeout penalties directly into empirical response time histograms makes latency percentiles statistically meaningless.

---

### 3.3 BF-P2-004: Integer Duration Truncation Distorts TPS

In `services/benchmark-service/internal/repository/leaderboard.go:99`:
```go
dur := int(duration.Int64)
if dur <= 0 {
    computedTps = 0.0
} else {
    computedTps = float64(totalReqs) / float64(dur)
}
```
- Because duration is stored as an `INTEGER` column in PostgreSQL:
  - A benchmark executing in 800ms has `dur = 0` $\to$ **TPS = 0.0**.
  - A benchmark executing in 1,900ms has `dur = 1` $\to$ **TPS is inflated by +90%**!

---

### 3.4 BF-P2-005: Replay TPS Hardcoded as `count * 2`

In `services/telemetry-service/internal/aggregator/replay_worker.go:126`:
```go
tps := count * 2 // simplified TPS derivation
```
- When rendering time-series charts on the frontend replay dashboard, bucket throughput is not computed from event timestamps. It is literally `bucket_count * 2`.
- If a bucket contains 5,000 requests processed over 10 seconds (500 TPS), Replay displays **10,000 TPS**!

---

## 4. Recommendations for Metric Integrity

1. **Implement High-Resolution Microsecond HdrHistogram**:
   Replace `LatencyHistogram` with an HdrHistogram or exponential histogram tracking microseconds from 1µs to 60,000,000µs with 3 significant figures of precision.
2. **Decouple Failure Accounting from Latency Distributions**:
   Do not inject 5,000ms penalties into response time histograms. Track `availability_rate = successful / total` separately, and record latency percentiles strictly over attempted/measured requests.
3. **Store Fractional Benchmark Durations**:
   Migrate `duration_seconds` to `NUMERIC(10, 4)` or store `duration_microseconds BIGINT` to preserve sub-second precision.
4. **Compute Replay Throughput from Delta Timestamps**:
   Compute bucket throughput as `float64(count) / (max(timestamp) - min(timestamp)).Seconds()`.
