# BenchForge Phase 2 Audit — Metric Correctness and Validation

**Workstream D: Metric Definitions, Measurement Boundaries, and Discrepancies**

---

## 1. Metric Specification Matrix

| Metric Name | Intended Definition | Unit | Implementation Measurement Boundary | Storage Column & Data Type | Auditor Status |
|---|---|---|---|---|---|
| **TPS (Throughput)** | Requests completed per elapsed second | req/s | Bot-worker client-side: from start of job loop to channel drain | `benchmarks.tps` (NUMERIC), `leaderboard_entries.tps` (NUMERIC) | ⚠️ FLAWED (Integer duration truncation) |
| **P50 Latency** | 50th percentile of request round-trip time | ms | Client-side: `time.Since(start)` in worker loop | `benchmarks.p50` (NUMERIC), `telemetry_metrics.latency` (BIGINT) | ❌ CRITICAL DISCREPANCY (ms vs ns) |
| **P90 Latency** | 90th percentile of request round-trip time | ms | Client-side: `time.Since(start)` in worker loop | `benchmarks.p90` (NUMERIC), `telemetry_metrics.latency` (BIGINT) | ❌ CRITICAL DISCREPANCY (ms vs ns) |
| **P99 Latency** | 99th percentile of request round-trip time | ms | Client-side: `time.Since(start)` in worker loop | `benchmarks.p99` (NUMERIC), `telemetry_metrics.latency` (BIGINT) | ❌ CRITICAL DISCREPANCY (ms vs ns) |
| **Success Rate** | (Successful requests / Total attempted) $\times 100$ | % | HTTP 2xx count / total completed jobs | `benchmarks.success_count` (BIGINT), `leaderboard_entries.success_rate` (NUMERIC) | ⚠️ FLAWED (Measures HTTP 2xx, not correctness) |
| **Correctness Score** | Weighted scenario pass percentage | % | Pre-validation: 6 static scenarios run sequentially | `submissions.correctness_score` (NUMERIC) | ⚠️ FLAWED (Static scenarios, NULL fallback) |
| **Concurrency Score** | Tracer pass rate blended with degradation ratio | % | (TracerSuccess / TracerTotal) blended with P99/P50 ratio | `leaderboard_entries.concurrency_score` (NUMERIC) | ⚠️ FLAWED (Defaults to 100 if tracers=0) |

---

## 2. Throughput (TPS) Calculation Audit (D1)

### Definition Discrepancy Across Services
There are two completely different TPS calculations in the codebase:

1. **Bot Worker Calculation (`main.go:313-317`):**
   ```go
   duration := time.Since(start)
   tps := 0.0
   if duration.Seconds() > 0 {
       tps = float64(completedJobs) / duration.Seconds()
   }
   ```
   Uses a floating-point duration (`duration.Seconds()`). This is mathematically sound.

2. **Leaderboard Service Calculation (`leaderboard.go:97-105`):**
   ```go
   dur := 0
   if duration.Valid {
       dur = int(duration.Int64)
   }
   computedTps := 0.0
   if dur > 0 {
       computedTps = float64(total) / float64(dur)
   }
   ```
   Reads `COALESCE(b.execution_time_seconds, b.duration_seconds)` which is defined as `INTEGER` in the PostgreSQL schema. It performs an **integer truncation** (`int(duration.Int64)`).

### Quantitative Impact of Integer Duration Truncation (BF-P2-004)
Demonstrated empirically in [`metrics_test.go:TestMetrics_ThroughputAccountingEdgeCases`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/metrics_test.go#L180-L230):

- **Scenario 1: Sub-Second Runs (Fast Mock or Small Benchmark):**
  - Total requests: 500
  - Actual elapsed duration: $0.80\text{ seconds}$
  - Bot Worker TPS: $\frac{500}{0.8} = 625.00\text{ req/s}$
  - Database `duration_seconds`: $\lfloor 0.8 \rfloor = 0$
  - **Leaderboard TPS:** `dur == 0` $\to$ **$0.00\text{ req/s}$**
  - **Auditor Verdict:** Any benchmark completing in $<1.0\text{s}$ receives **zero TPS** and a final leaderboard score of **0.00**.
- **Scenario 2: Fractional Second Rounding Distortion:**
  - Total requests: 500
  - Actual elapsed duration: $1.90\text{ seconds}$
  - Bot Worker TPS: $\frac{500}{1.9} = 263.16\text{ req/s}$
  - Database `duration_seconds`: $\lfloor 1.9 \rfloor = 1$
  - **Leaderboard TPS:** $\frac{500}{1} = \mathbf{500.00\text{ req/s}}$
  - **Auditor Verdict:** Truncating 1.9s to 1s creates an **artificial 90% throughput inflation**!

---

## 3. Latency Percentiles & The 1,000,000x Unit Mismatch (D2)

### Latency Measurement Boundary
Latency is measured inside `Worker()` in `pool.go:157-159`:
```go
start := time.Now()
resp, err := bots.SendOrder(ctx, client, exchangeURL, order)
latency := time.Since(start)
```
- **Included:** Client OS TCP queueing, HTTP request serialization, network transit, container reverse proxy/routing, engine matching execution, HTTP response serialization, client read and deserialization.
- **Excluded:** Container startup, pre-validation time, Redis Streams telemetry queueing, and database write time.
- **Coordinated Omission:** When an engine stalls under high load, worker goroutines block waiting for HTTP responses (up to the 5s timeout). If all 100 goroutines block, request generation stalls. No new requests are queued, masking true queuing latency during saturation.

### The 1,000,000x Latency Unit Discrepancy (BF-P2-003)
This is a critical cross-service defect:

1. **Origin in `bot-worker`:**
   - `latency := time.Since(start)` produces `time.Duration`, which in Go is an `int64` representing **nanoseconds**.
   - `metrics.RequestMetric.Latency` is typed as `time.Duration`. When marshaled to JSON, it serializes as integer nanoseconds: `{"latency": 15000000}` for 15ms.
2. **Ingestion in `telemetry-service`:**
   - `consumer.go:32` parses JSON into `Metric.Latency int64`. It receives `15000000`.
   - `database.InsertMetric` writes this raw integer into `telemetry_metrics (latency BIGINT)`. The database contains **nanoseconds**.
   - In-memory aggregator `agg.AddMetric(float64(metric.Latency), ...)` appends nanoseconds to `latencies []float64`.
   - The live WebSocket broadcast emits snapshots where `P50`, `P90`, and `P99` are in **nanoseconds** (e.g., `15000000` instead of `15.0`).
   - The Replay query executes `PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency)` directly on `telemetry_metrics`, producing percentiles in **nanoseconds**.
3. **Contrast with `bot-worker` Summary & Leaderboard:**
   - In `bot-worker/cmd/worker/main.go:295`: `hist.Add(result.Latency.Seconds() * 1000)` explicitly converts nanoseconds to **milliseconds** (`15.0`).
   - `benchmarks` summary table stores `p50=15.0`, `p90=15.0`, `p99=15.0`.
   - `leaderboard.go:167` computes `latencyFactor := 250.0 / (250.0 + p99)`, expecting milliseconds ($250 / 265 = 0.943$).

### Numerical Impact:
As proven in [`metrics_test.go:152-178`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/metrics_test.go#L152-L178):
- If the Replay Engine or Live Telemetry values were fed into the leaderboard scoring formula:
  $$\text{LatencyFactor}_{\text{ms}} = \frac{250}{250 + 15} = 0.9434$$
  $$\text{LatencyFactor}_{\text{ns}} = \frac{250}{250 + 15,000,000} = 0.00001667$$
  The nanosecond value results in a **99.998% score wipeout**!
- The frontend live dashboard displays latency numbers that are 1,000,000x larger than the benchmark summary and leaderboard values.

---

## 4. Success Rate & Error Accounting (D3)

### Numerator and Denominator
- **Numerator:** Count of requests where `err == nil && checkCorrectnessStub(resp)`.
- **Denominator:** `TotalCompletedJobs` (total jobs pulled from the queue).
- **Core Defect:** Because `checkCorrectnessStub` simply returns `resp.StatusCode >= 200 && resp.StatusCode < 300`, the numerator measures **HTTP 2xx responses**, not successful trades.

### The 5000ms Failure Penalty Policy
BenchForge implements a strict policy: *Failed requests are infinitely slow requests*.
In `bot-worker/cmd/worker/main.go:292`:
```go
if !result.Success {
    hist.Add(5000.0) // Heavily penalize failed requests to avoid survivorship bias
} else {
    hist.Add(result.Latency.Seconds() * 1000)
}
```

### Empirical Behavior of the 5000ms Penalty:
Verified in [`metrics_test.go:TestMetrics_FailurePenaltyImpactOnPercentiles`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/metrics_test.go#L115-L150):
- **0% Failures:** P50 = 10ms, P90 = 10ms, P99 = 10ms.
- **1% Failures (10 / 1000):** P50 = 10ms, P90 = 10ms, P99 = 10ms. (The top 1% is absorbed by the 99th percentile boundary).
- **2% Failures (20 / 1000):** P50 = 10ms, P90 = 10ms, **P99 = 5000ms!**
- **10% Failures (100 / 1000):** P50 = 10ms, P90 = 10ms, **P99 = 5000ms**.
- **11% Failures (110 / 1000):** P50 = 10ms, **P90 = 5000ms**, **P99 = 5000ms**.

**Auditor Evaluation:** The 5000ms penalty is an effective defense against survivorship bias. Any engine that sheds more than 1% of its load is heavily penalized with a 5000ms P99, dropping its `latencyFactor` from $\sim 0.95$ down to $\frac{250}{250 + 5000} = 0.0476$ (a 95% penalty).

---

## 5. Correctness Metrics & Fallback Loophole (D4)

### Pre-Validation Weighting
In `benchmarks.go:269-276`:
```go
scenarioWeights := map[string]float64{
    "basic_resting_order":     15.0,
    "basic_matching_order":    15.0,
    "partial_fill_order":      15.0,
    "price_improvement":       20.0,
    "fifo_priority":           20.0,
    "multi_level_price_sweep": 15.0,
}
```
$$\text{CorrectnessScore} = \left(\frac{\sum \text{Passed Weights}}{100.0}\right) \times 100$$

### The NULL Correctness Fallback Loophole (BF-P2-001)
In `leaderboard.go:111-115`:
```go
// Use correctness score from submission if present, otherwise fallback to success rate
cScore := computedSuccessRate
if correctnessScore.Valid {
    cScore = correctnessScore.Float64
}
```
- If an engine fails scenario checks due to returning unsupported/legacy responses, `correctnessScore` in `submissions` remains `NULL`.
- When `UpsertLeaderboardEntryFromBenchmark` executes, `correctnessScore.Valid` is `false`.
- **The code falls back to `computedSuccessRate`!**
- Because `checkCorrectnessStub` returns `true` for all 200 OK responses during the load test, `computedSuccessRate = 100.0%`.
- **Result:** An engine that completely fails pre-validation is granted a **100% correctness score** on the leaderboard.

---

## 6. Cross-Metric Consistency Check (D5)

| Metric Combination | Actual Platform Behavior | Consistency Assessment |
|---|---|---|
| **Zero Completed Requests, Non-Zero Duration** | `total = 0` $\to$ `tps = 0.0`, `successRate = 0.0`, `finalScore = 0.0`. | Consistent. |
| **Non-Zero Requests, Sub-Second Duration ($<1.0\text{s}$)** | `dur = 0` $\to$ `tps = 0.0`, `successRate = 100.0%`, `finalScore = 0.0`. | **CONTRADICTION:** 500 successful operations yield 0 TPS and 0 score. |
| **Failed Correctness Pre-Validation + 200 OK Load Test** | `correctness_score = NULL`, `cScore = 100.0%`, `finalScore = high`. | **CONTRADICTION:** Engine failed validation but is scored as 100% correct. |
| **P99 in Telemetry vs P99 in Leaderboard** | Telemetry P99: 15,000,000 ns; Leaderboard P99: 15.0 ms. | **CONTRADICTION:** 1,000,000x difference across views. |
| **Replay Bucket TPS vs Benchmarks Table TPS** | Replay displays `tps = count * 2`; Benchmarks table displays `count / duration`. | **CONTRADICTION:** Replay TPS diverges by up to 20x from actual benchmark TPS. |
