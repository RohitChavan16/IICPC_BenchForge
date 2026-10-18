# BenchForge Phase 4 — Concurrency, Multi-Tenant Contention & Serialization

**Audit Date:** 2026-10-17  
**Scope:** Multi-job benchmark concurrency, queue scheduling, serialization bottlenecks, and cross-job interference.  
**Auditor:** Independent Senior Performance & Systems Auditor (Phase 4)

---

## 1. Executive Summary

A core promise of cloud-based competition and evaluation platforms is multi-tenant scalability—the ability to run independent benchmarks concurrently across different teams without cross-job interference or catastrophic queue delays.

This audit evaluated BenchForge's multi-job execution layer and discovered a **hardcoded serialization constraint (BF-P4-006)** in `benchmark-service`: **the platform permits only ONE active benchmark at a time globally (`MAX_CONCURRENT_BENCHMARKS = 1`)**. All concurrent submissions are serialized into a FIFO database queue. Consequently, BenchForge exhibits **zero horizontal multi-job throughput scaling**.

---

## 2. Queue Architecture & Serialization Analysis

### 2.1 The Hardcoded Concurrency Ceiling
In `services/benchmark-service/internal/handlers/benchmarks.go:100-116`:
```go
func (h *BenchmarkHandler) ProcessQueue() {
    count, err := repository.CountRunningBenchmarks(h.db)
    if err != nil {
        log.Printf("ProcessQueue error counting: %v", err)
        return
    }
    if count >= 1 {
        return // Max concurrent benchmarks reached (HARDCODED SERIALIZATION!)
    }

    b, err := repository.DequeueNextBenchmark(h.db)
    ...
```

### 2.2 Mathematical Consequences of Serial Scheduling
Because `count >= 1` aborts queue processing immediately:
1. Regardless of how many CPU cores or worker containers are provisioned, **only one trading engine is benchmarked at any given second**.
2. **Global Throughput Ceiling**: The platform's total benchmark completion rate is strictly:
   $$\text{Capacity} = \frac{3,600}{\text{Elapsed Duration per Benchmark (sec)}}\text{ benchmarks/hour}$$
3. For a typical 30-second benchmark (including pre-validation, 5s warmup, execution, and drainage):
   $$\text{Capacity} = \frac{3,600}{30} = 120\text{ benchmarks/hour (Constant)}$$
4. Additional concurrent submissions do **not** increase platform throughput; they merely inflate queue depth and user wait time.

---

## 3. Empirical Queue Wait Scaling (`concurrency_serialization_test.go`)

The table below demonstrates the queue wait times and wall-clock completion times for concurrent benchmark submissions, verified in `audit/phase-4/tests/concurrency_serialization_test.go`:

| Concurrent Submissions ($M$) | Benchmark Duration ($T$) | Total Elapsed Wall-Clock | Worst-Case Queue Wait | Average Queue Wait | Multi-Job Scaling Factor |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **1 Job** | 30s | 30s | 0s | 0s | Baseline |
| **2 Jobs** | 30s | 1m 00s | 30s | 15s | **0.0 (Zero scaling)** |
| **5 Jobs** | 30s | 2m 30s | 2m 00s | 1m 00s | **0.0 (Zero scaling)** |
| **10 Jobs** | 30s | 5m 00s | 4m 30s | 2m 15s | **0.0 (Zero scaling)** |
| **50 Jobs** (Contest Peak) | 30s | 25m 00s | 24m 30s | 12m 15s | **0.0 (Zero scaling)** |

```
Queue Wait Progression (T = 30s)
Wait Time (min)
   25 |                                                                    /
   20 |                                                                  /
   15 |                                                                /
   10 |                                                /-------------+
    5 |                                /---------------+
    0 +----------------+---------------+---------------+------------------->
      1 Job          5 Jobs          10 Jobs         50 Jobs (Submissions)
```

---

## 4. Cross-Job Interference & Head-of-Line Blocking

Because jobs run strictly sequentially, cross-job interference does not manifest as CPU or memory contention. Instead, it manifests as **Head-of-Line (HoL) Blocking**:

| Scenario | Behavior in BenchForge | Impact on Other Participants |
| :--- | :--- | :--- |
| **Large Workload Monopolization** | Team A submits a 500,000-order benchmark taking ~2.5 minutes. | All other teams are blocked in the queue for 2.5 minutes. |
| **Hanging / Infinite Loop Engine** | Team B's engine hangs and never responds to HTTP orders. | The queue freezes for **5 minutes** until the background DB watchdog reaps the job. |
| **Manual Cancellation Defect (BF-P3-003)** | An admin stops Team C's benchmark via `POST /benchmarks/:id/stop`. | `ProcessQueue()` is not called; **all waiting benchmarks starve permanently** until service restart! |

---

## 5. Multi-Tenant Contention Matrix

| Shared Component | Contention Risk Under Concurrency | Isolation Mechanism | Real Severity |
| :--- | :--- | :--- | :--- |
| **Benchmark Execution Slot** | **100% Contention (Single Slot)** | FIFO Database Queue | **HIGH (BF-P4-006)** |
| **Host CPU & Memory** | Zero Contention (Jobs do not overlap) | Software Serialization | Low (by consequence of serialization) |
| **PostgreSQL Connection Pool** | Contention between API Gateway & Ingestion | Shared `pgxpool` (`max_conns = 10`) | Medium |
| **Redis Streams Key** | Shared `telemetry_stream` | Monolithic Stream Key | Medium |
| **Port Allocation Range** | TOCTOU collision during concurrent deploys | Ephemeral socket probing | **MEDIUM (BF-P3-009)** |

---

## 6. Architectural Recommendations

1. **Remove Hardcoded Concurrency Limit**:
   Make `MAX_CONCURRENT_BENCHMARKS` a configurable environment variable (`BENCHMARK_CONCURRENCY=4` or dynamic based on host CPU cores).
2. **Partition Worker Deployments**:
   Assign separate Docker networks and port ranges dynamically via an atomic database reservation table.
3. **Dedicated Redis Stream per Benchmark**:
   Use `telemetry_stream:{benchmark_id}` instead of a monolithic shared stream to isolate message queues between concurrent runs.
