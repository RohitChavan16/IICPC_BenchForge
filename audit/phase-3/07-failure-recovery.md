# BenchForge Phase 3 — Failure Recovery and Self-Healing Audit

**Audit Date:** 2026-10-17  
**Scope:** Resilience, watchdog mechanisms, worker crash recovery, queue starvation, context propagation, and self-healing across BenchForge.  
**Auditor:** Independent Systems & Security Auditor (Phase 3)

---

## 1. Executive Summary

In a multi-tenant competitive benchmarking platform, services will inevitably crash, workloads will hang, containers will run out of memory, and network calls will time out. A robust platform must detect stalled executions, reclaim resources, unblock waiting queues, and gracefully handle cancellations without operator intervention.

This audit evaluated BenchForge's self-healing mechanisms, including the database watchdog, worker crash recovery, and queue processing logic. We identified **one High-severity defect (BF-P3-003)** where manual benchmark cancellation starves the execution queue indefinitely, alongside a lack of immediate crash recovery for killed bot workers.

| Failure Scenario | Recovery Mechanism | Recovery Time | Audit Assessment |
| :--- | :--- | :--- | :--- |
| **Hanging / Frozen Engine** | Background DB Watchdog (60s ticker) | ~5 minutes | **Verified Effective** |
| **Manual Cancellation** | `POST /benchmarks/:id/stop` | **NEVER (Stalls Queue)** | **DEFECT (BF-P3-003)** |
| **Worker Process Crash** | Watchdog timeout (Passive) | ~5 minutes | Operational Gap (No heartbeat) |
| **Redis Outage** | Exponential backoff in consumers | Immediate upon Redis return | Partially Verified |
| **Context Cancellation** | Go `context.WithCancel` | Immediate | Verified in Worker Pools |

---

## 2. Watchdog & Recovery Architecture

```
+----------------------------------------------------------------------------------------------------+
|                                    Failure Recovery Lifecycle                                      |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [Benchmark Queue]                                                                                 |
|       |                                                                                            |
|       | ProcessQueue() pulls next PENDING benchmark (Limit: MAX_CONCURRENT_BENCHMARKS = 1)         |
|       v                                                                                            |
|  [Active Benchmark: RUNNING]                                                                       |
|       |                                                                                            |
|       +--------------------------------------------------------------------+                       |
|       | Path A: Normal Completion                                          |                       |
|       | -> Status = COMPLETED -> defer ProcessQueue() [QUEUE UNBLOCKED]    |                       |
|       +--------------------------------------------------------------------+                       |
|       | Path B: Engine Hang / Infinite Loop                                |                       |
|       | -> Watchdog checks every 60s -> Status = TIMED_OUT (after 5 min)   |                       |
|       | -> Spawns ProcessQueue() [QUEUE UNBLOCKED]                         |                       |
|       +--------------------------------------------------------------------+                       |
|       | Path C: Manual Cancellation (POST /benchmarks/:id/stop)            |                       |
|       | -> Status = CANCELLED                                              |                       |
|       | -> OMITTED: ProcessQueue() NEVER CALLED! [QUEUE STARVED!]          |                       |
|       +--------------------------------------------------------------------+                       |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Deep Dive: Queue Starvation Defect (BF-P3-003)

### 3.1 Defect Analysis
In `services/benchmark-service/internal/handlers/benchmarks.go`:
```go
// StopBenchmark handles POST /benchmarks/{id}/stop
func (h *Handler) StopBenchmark(c *gin.Context) {
    id := c.Param("id")
    
    // Updates status in PostgreSQL to 'CANCELLED'
    err := h.repo.UpdateStatus(c.Request.Context(), id, "CANCELLED")
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stop benchmark"})
        return
    }

    // DEFECT (BF-P3-003):
    // Notice what is MISSING here:
    // In normal execution, when a benchmark completes or errors:
    //     defer h.ProcessQueue()
    // Here, the benchmark slot is freed in the DB, but ProcessQueue() is NEVER triggered!
    
    c.JSON(http.StatusOK, gin.H{"message": "Benchmark cancelled"})
}
```

### 3.2 Impact and Manifestation
1. `benchmark-service` enforces a strict concurrency ceiling (`MAX_CONCURRENT_BENCHMARKS = 1`).
2. If Team A starts a benchmark, and Team B submits a benchmark, Team B's benchmark enters status `PENDING` in the queue.
3. If an administrator or Team A issues `POST /benchmarks/{teamA_id}/stop`:
   - The active benchmark status transitions to `CANCELLED`.
   - The single concurrency execution slot is now free in the database.
   - **However**, because `h.ProcessQueue()` is not called, no goroutine wakes up to inspect the queue.
4. Team B's benchmark remains in status `PENDING` indefinitely.
5. The queue remains completely starved until either:
   - A third user submits a new benchmark (triggering `ProcessQueue()` on insertion), or
   - The `benchmark-service` container is manually restarted.

### 3.3 Audit Test Verification
In `audit/phase-3/tests/failure_recovery_test.go`:
```go
func TestManualCancellationQueueStarvation(t *testing.T) {
    // Simulates active benchmark and queued benchmark.
    // Stops active benchmark via StopBenchmark handler logic.
    // Verifies that without explicit queue dispatch, queued benchmark never runs.
}
```
**Test Result:** Verified. Queue remains locked/starved after manual stop.

### 3.4 Remediation
Add `go h.ProcessQueue()` immediately after the status update:
```go
func (h *Handler) StopBenchmark(c *gin.Context) {
    id := c.Param("id")
    err := h.repo.UpdateStatus(c.Request.Context(), id, "CANCELLED")
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stop benchmark"})
        return
    }
    
    // Unblock the queue for waiting benchmarks!
    go h.ProcessQueue()
    
    c.JSON(http.StatusOK, gin.H{"message": "Benchmark cancelled"})
}
```

---

## 4. Stalled Execution & Watchdog Recovery

### 4.1 Implementation Inspection
In `services/benchmark-service/internal/watchdog/watchdog.go`:
```go
func (w *Watchdog) Start(ctx context.Context) {
    ticker := time.NewTicker(60 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            w.reapStaleBenchmarks(ctx)
        }
    }
}
```
- Query executed:
  ```sql
  UPDATE benchmarks 
  SET status = 'TIMED_OUT', error_message = 'Benchmark execution exceeded 5 minute timeout'
  WHERE status = 'RUNNING' AND updated_at < NOW() - INTERVAL '5 minutes'
  RETURNING id;
  ```
- If stale benchmarks are reaped, the watchdog invokes `w.queueProcessor.ProcessQueue()`.

### 4.2 Audit Evaluation
- **Strengths:** If an engine enters an infinite loop or a worker dies silently without notifying the API, the watchdog will reclaim the slot after 5 minutes and unblock the queue.
- **Weaknesses:** 5 minutes is a long starvation window in a live contest with hundreds of participants. A 60-second heartbeat mechanism between `bot-worker` and `benchmark-service` would reduce this recovery latency from 300 seconds to under 30 seconds.

---

## 5. Verification Test Matrix

All tests below are implemented and verified in `audit/phase-3/tests/failure_recovery_test.go`:

| Test Name | Target Behavior | Expected Result | Actual Audit Result |
| :--- | :--- | :--- | :--- |
| `TestWatchdogTimeoutRecovery` | Watchdog reaps benchmarks older than 5 minutes | Status set to `TIMED_OUT`, slot reclaimed | **PASS** (Watchdog logic sound) |
| `TestManualCancellationQueueStarvation` | Manual `StopBenchmark` execution | Must unblock queue and trigger next job | **FAIL (Defect BF-P3-003)**: Queue starves |
| `TestContextCancellationPropagation` | Parent HTTP context cancellation | Child worker pools terminate immediately | **PASS** (Goroutines exit cleanly) |

---

## 6. Architectural Recommendations

1. **Trigger `ProcessQueue()` on Stop (BF-P3-003 Fix)**:
   Add `go h.ProcessQueue()` in `benchmark-service/internal/handlers/benchmarks.go:StopBenchmark`.
2. **Implement Worker Heartbeat Reporting**:
   Add an active heartbeat column `last_heartbeat TIMESTAMPTZ` updated every 5 seconds by `bot-worker`. Reclaim stalled benchmarks if no heartbeat is received for 30 seconds.
3. **Graceful Worker Shutdown**:
   Ensure `bot-worker` listens for `SIGINT` / `SIGTERM` and sends an explicit `FAILED` or `CANCELLED` status update to `benchmark-service` during shutdown rather than abandoning the job.
