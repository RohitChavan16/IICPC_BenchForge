# BenchForge Phase 4 — Findings Register

**Audit Date:** 2026-10-17  
**Scope:** Performance, Scalability, Bottlenecks, and Metric Integrity  
**Auditor:** Independent Senior Performance & Systems Auditor (Phase 4)

---

## 1. Summary Findings Register

| ID | Title | Severity | Status | Affected Component | File / Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BF-P4-001** | Latency Histogram Truncates Sub-Millisecond Latency to 0ms | **Critical** | **Verified** | Bot Worker | `bot-worker/cmd/worker/percentiles.go:18-28` |
| **BF-P4-002** | Unclosed HTTP `resp.Body` Leaks Sockets & Disables Keep-Alive | **High** | **Verified** | Bot Worker | `bot-worker/internal/workers/pool.go:158-177` |
| **BF-P4-003** | Single-Row DB Ingestion Bottleneck Caps Platform at 1,200 TPS | **High** | **Verified** | Telemetry Service | `telemetry-service/internal/consumer/consumer.go:373` |
| **BF-P4-004** | Channel Buffer Preallocation Causes Instant Memory Spikes | **High** | **Verified** | Bot Worker | `bot-worker/cmd/worker/main.go:204-205` |
| **BF-P4-005** | Platform Orchestration Overhead Accounts for 88%–93% of Runtime | **High** | **Verified** | Full Pipeline | `bot-worker/cmd/worker/main.go:227` & Services |
| **BF-P4-006** | Hardcoded Global Concurrency Limit Enforces Serial Queue | **High** | **Verified** | Benchmark Service | `benchmark-service/internal/handlers/benchmarks.go:106` |
| **BF-P4-007** | Super-Linear Sorting Overhead in Replay Window Query | **Medium** | **Verified** | Telemetry Aggregator | `telemetry-service/internal/aggregator/replay_worker.go:69-93` |
| **BF-P4-008** | Tail Latency Warping via Injected 5000ms Failure Penalty | **Medium** | **Verified** | Bot Worker | `bot-worker/cmd/worker/main.go:293` |

---

## 2. Detailed Findings Register

### BF-P4-001: Latency Histogram Truncates Sub-Millisecond Latency to 0ms
- **Severity:** Critical
- **Status:** Verified
- **Affected File:** `services/bot-worker/cmd/worker/percentiles.go:18-28`
- **Description:** `Add()` converts durations into integer millisecond buckets via `math.Round(latencyMs)`. Any latency below 0.5ms (500µs) rounds to 0.
- **Impact:** Trading engines executing orders in 100µs–450µs report **P50 = 0.0 ms, P99 = 0.0 ms**. High-performance engines cannot be distinguished from slower sub-millisecond engines.
- **Reproduction:** Verified in `audit/phase-4/tests/metric_histogram_test.go:TestHistogramSubMillisecondQuantizationDefect`.
- **Remediation:** Replace `LatencyHistogram` with an HdrHistogram recording microseconds with floating-point or log-bucket precision.

---

### BF-P4-002: Unclosed HTTP `resp.Body` Leaks Sockets & Disables Keep-Alive
- **Severity:** High
- **Status:** Verified
- **Affected File:** `services/bot-worker/internal/workers/pool.go:158-177`
- **Description:** In the worker loop, `resp, err := bots.SendOrder(...)` is executed without closing `resp.Body`.
- **Impact:** In Go's `net/http`, failing to read and close `resp.Body` prevents connection reuse. The client dials a brand new TCP connection for every single order, creating 100% dial churn, exhausting OS ephemeral ports, and increasing median latency by 7x.
- **Reproduction:** Verified in `audit/phase-4/tests/http_transport_leak_test.go:TestHTTPConnectionReuseFailure`.
- **Remediation:** Add `io.Copy(io.Discard, resp.Body)` and `resp.Body.Close()` immediately after checking `err == nil`.

---

### BF-P4-003: Single-Row DB Ingestion Bottleneck Caps Platform at 1,200 TPS
- **Severity:** High
- **Status:** Verified
- **Affected File:** `services/telemetry-service/internal/consumer/consumer.go:373`
- **Description:** For every message read from Redis Streams, `processMessage` calls `database.InsertMetric()`, issuing an individual `db.Exec()` to PostgreSQL.
- **Impact:** Database network round-trips cap consumer ingestion to ~1,200 rows/second. When offered load exceeds 1,200 req/s, Redis Streams accumulates massive backlogs (up to 88% of requests), causing up to 90 seconds of post-run drainage lag.
- **Reproduction:** Verified in `audit/phase-4/tests/telemetry_drainage_test.go:TestTelemetryDrainageBacklogModel`.
- **Remediation:** Ingest telemetry messages in batches using `pgx.Batch` (e.g. 500 rows per batch transaction).

---

### BF-P4-004: Channel Buffer Preallocation Causes Instant Memory Spikes
- **Severity:** High
- **Status:** Verified
- **Affected File:** `services/bot-worker/cmd/worker/main.go:204-205`
- **Description:** `jobs` and `results` channels are allocated with capacity equal to `req.TotalRequests`.
- **Impact:** Sizing `results` (`RequestMetric`, 152 bytes) to 1,000,000 requests preallocates 145 MB of heap immediately; 5,000,000 requests preallocates 725 MB, causing worker containers to be killed by the host OOM killer.
- **Reproduction:** Verified in `audit/phase-4/tests/channel_memory_test.go:TestChannelBufferMemoryScaling`.
- **Remediation:** Cap channel buffers to a constant size (e.g. 10,000 items) and stream items via a producer goroutine.

---

### BF-P4-005: Platform Orchestration Overhead Accounts for 88%–93% of Runtime
- **Severity:** High
- **Status:** Verified
- **Affected Files:** `services/bot-worker/cmd/worker/main.go:227` and deployment orchestration
- **Description:** A static 5,000ms warmup delay, sequential scenario validation, and unbatched telemetry drainage lag constitute 87.8% to 93.2% of total elapsed wall-clock time for small-to-medium benchmarks.
- **Impact:** Competitors wait 16+ seconds for a benchmark that executes trading code for only 2 seconds.
- **Reproduction:** Verified in `audit/phase-4/tests/concurrency_serialization_test.go:TestLifecycleOverheadBreakdown`.
- **Remediation:** Make warmup duration configurable, run pre-validation scenarios concurrently, and batch database inserts.

---

### BF-P4-006: Hardcoded Global Concurrency Limit Enforces Serial Queue
- **Severity:** High
- **Status:** Verified
- **Affected File:** `services/benchmark-service/internal/handlers/benchmarks.go:106`
- **Description:** `CountRunningBenchmarks` enforces `if count >= 1 { return }`.
- **Impact:** Only one benchmark can run globally across the entire platform. Concurrent submissions queue serially in a FIFO database table, yielding zero multi-job horizontal throughput scaling.
- **Reproduction:** Verified in `audit/phase-4/tests/concurrency_serialization_test.go:TestSingleBenchmarkConcurrencySerialization`.
- **Remediation:** Replace hardcoded `1` with a configurable concurrency limit (`MAX_CONCURRENT_BENCHMARKS = N`).

---

### BF-P4-007: Super-Linear Sorting Overhead in Replay Window Query
- **Severity:** Medium
- **Status:** Verified
- **Affected File:** `services/telemetry-service/internal/aggregator/replay_worker.go:69-93`
- **Description:** Replay snapshot query executes a window function `COUNT(*) OVER (ORDER BY created_at)` plus 20 buckets containing 3x `PERCENTILE_CONT` continuous percentile sorts.
- **Impact:** For a 100,000-row benchmark, PostgreSQL must execute 61 distinct sorting passes, consuming high CPU and memory or spilling to disk.
- **Reproduction:** Verified in `audit/phase-4/tests/replay_aggregation_test.go:TestReplayAggregationComputationalComplexity`.
- **Remediation:** Compute pre-aggregated 1-second telemetry rollups during ingestion rather than performing full table window sorts at finalization.

---

### BF-P4-008: Tail Latency Warping via Injected 5000ms Failure Penalty
- **Severity:** Medium
- **Status:** Verified
- **Affected File:** `services/bot-worker/cmd/worker/main.go:293`
- **Description:** For any request where `!result.Success`, the worker executes `hist.Add(5000.0)`.
- **Impact:** Mixing an arbitrary 5-second failure penalty into empirical response time distributions artificially forces P99/P99.9 to 5,000.0ms even if actual order responses were fast.
- **Reproduction:** Verified in `audit/phase-4/tests/metric_histogram_test.go:TestHistogramFailedPenaltyDistortion`.
- **Remediation:** Record availability and error rates separately from latency distributions.
