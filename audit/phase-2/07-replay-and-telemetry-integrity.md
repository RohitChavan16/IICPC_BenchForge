# BenchForge Phase 2 Audit — Replay, Telemetry, and Result Consistency

**Workstream F: Telemetry Pipelines, Replay Engine Semantics, and Data Integrity**

---

## 1. Replay Engine Architecture: Visualization vs True Replay

A fundamental architectural finding of this audit is that **BenchForge does not perform a deterministic state replay**. 

The "Replay Engine" does not re-feed recorded orders through a reference matching engine to reproduce order-book state transitions. Instead, it is an **aggregated historical telemetry visualizer** that partitions stored telemetry rows into 20 chronological progress buckets (5% intervals from 0% to 100%) and renders them in the frontend player.

```
Bot Worker ──(XADD)──► Redis Streams ──(XReadGroup)──► Telemetry Service
                                                            │
                                                     INSERT (unbatched)
                                                            ▼
                                                   PostgreSQL: telemetry_metrics
                                                            │
                                             Trigger: STOP_STREAM control metric
                                                            ▼
                                              PostgreSQL Window Function Query
                                                            │
                                              20 Buckets (PERCENTILE_CONT)
                                                            ▼
                                                   benchmark_replays (JSON)
```

---

## 2. Telemetry Ingestion Pipeline Verification

Inspection of `services/telemetry-service/internal/consumer/consumer.go` verified the following stream-processing mechanics:

| Component | Implementation Mechanism | Auditor Verification Status |
|---|---|---|
| **Stream Grouping** | `XReadGroup` with group name `telemetry_group` and consumer ID | ✅ VERIFIED in code (`consumer.go:45-120`) |
| **Worker Authentication** | HMAC-SHA256 JWT in `metric.Token` validated against `WORKER_SECRET` | ✅ VERIFIED in code (`consumer.go:337-350`) |
| **Idempotency** | `INSERT INTO telemetry_metrics ... ON CONFLICT (request_id) DO NOTHING` | ✅ VERIFIED in code (`metrics.go:24-30`) |
| **ACK Delivery Guarantee** | `rdb.XAck` called **strictly after** successful DB insert | ✅ VERIFIED in code (`consumer.go:464-470`) |
| **Dead-Letter Queue (DLQ)** | Messages failing insert retried 3 times, then `XADD` to `telemetry_dlq` | ✅ VERIFIED in code (`consumer.go:405-412`) |
| **Abandoned Message Recovery** | Background loop calls `XPendingExt` and `XClaim` for messages idle $>5\text{ min}$ | ✅ VERIFIED: Tested in `recovery_test.go` |

### Ingestion Scalability Risk (BF-P1-027)
While the delivery guarantees are robust, `consumer.go:136-154` processes messages from the batch **one row at a time via individual `db.Exec` calls**. Under the platform's claimed 10,000–20,000 TPS, this produces 10,000–20,000 sequential SQL statements per second over a single database connection pool, creating severe database lock contention and write latency.

---

## 3. The 20-Bucket Postgres Window Query Audit

When `bot-worker` completes a run, it emits a control metric with `bot_type="system_control"` and `worker_id="STOP_STREAM"`. This triggers `aggregator.GenerateReplay()` in `replay_worker.go:26`.

### The PostgreSQL Aggregation Query (`replay_worker.go:69-93`):
```sql
WITH cumulative AS (
    SELECT 
        latency, success, bot_type, created_at,
        COUNT(*) OVER (ORDER BY created_at) as cumulative_requests
    FROM telemetry_metrics
    WHERE benchmark_id = $1
),
bucketed AS (
    SELECT 
        latency, success, bot_type,
        FLOOR(((cumulative_requests - 1) * 20.0) / $2::float) + 1 as bucket
    FROM cumulative
)
SELECT 
    bucket,
    COUNT(*) as requests_processed,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency) as p50,
    PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY latency) as p90,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency) as p99
FROM bucketed
GROUP BY bucket
ORDER BY bucket;
```

### Analysis of the Window Function:
- Partitioning by cumulative request count ($\lfloor (i-1) \times 20 / N \rfloor + 1$) correctly splits the dataset into 20 equal-sized buckets of $\frac{N}{20}$ requests each.
- `PERCENTILE_CONT` uses continuous linear interpolation for percentile calculation within each bucket.
- **Defect:** `ORDER BY latency` operates directly on `telemetry_metrics.latency`, which stores **nanoseconds**. Therefore, the returned `p50`, `p90`, and `p99` values in the replay snapshot are in **nanoseconds**, whereas the Replay UI expects milliseconds.

---

## 4. Confirmed Replay Defects

### Defect 1: Hardcoded Replay TPS Falsification (BF-P2-005 / BF-P1-007)
In `replay_worker.go:126`:
```go
tps := count * 2 // simplified TPS derivation
```
The Replay worker **does not measure time** to compute bucket throughput. It takes the number of requests in the bucket (`count`) and multiplies it by 2!

#### Empirical Verification in [`replay_test.go:TestReplay_HardcodedTPSFalsification`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/replay_test.go#L95-L165):
1. **At Expected Scale (1000 requests in 10s $\to$ Actual TPS = 100):**
   - Each bucket has 50 requests over 0.5s.
   - Replay computes: $50 \times 2 = 100\text{ TPS}$. It matches by pure coincidence because duration happened to be 0.5s per bucket!
2. **High-Performance Benchmark (1000 requests in 0.5s $\to$ Actual TPS = 2000):**
   - Replay displays: $50 \times 2 = \mathbf{100.00\text{ TPS}}$.
   - **Error Ratio:** **20.41x UNDER-REPORTED!** A 2,000 TPS engine is displayed to the user as running at 100 TPS.
3. **Slow Engine Benchmark (1000 requests in 50s $\to$ Actual TPS = 20):**
   - Replay displays: $50 \times 2 = \mathbf{100.00\text{ TPS}}$.
   - **Error Ratio:** **4.90x ARTIFICIALLY INFLATED!** A slow 20 TPS engine is displayed as running at 100 TPS.

**Auditor Impact:** All TPS curves shown in the Replay Engine UI are completely fabricated artifacts of bucket count, with zero relationship to actual execution speed.

### Defect 2: Fabricated Lifecycle Timestamps (BF-P2-006 / BF-P1-008)
In `replay_worker.go:267-276`:
```go
if bmData.StartedAt != "" {
    // Rough estimate for build/deploy since we don't have exact from benchmark metadata
    events = append(events, LifecycleEvent{Phase: "BUILD", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
    events = append(events, LifecycleEvent{Phase: "DEPLOY", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
    events = append(events, LifecycleEvent{Phase: "VALIDATION", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
    events = append(events, LifecycleEvent{Phase: "BENCHMARK", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
}
```
All four distinct phases (`BUILD`, `DEPLOY`, `VALIDATION`, `BENCHMARK`) receive the exact same timestamp string (`bmData.StartedAt`). The user-facing replay timeline displays simultaneous zero-second durations for all historical pipeline stages.

---

## 5. Cross-Service Telemetry Consistency Evaluation

| Data Artifact | Metric | Storage / Transport | Unit | Reliability Assessment |
|---|---|---|---|---|
| **Bot Worker In-Memory Histogram** | P50, P90, P99 | `benchmarks` DB table | Milliseconds (ms) | ✅ ACCURATE (1ms resolution) |
| **Telemetry In-Memory Aggregator** | P50, P90, P99 | WebSocket live broadcast | Nanoseconds (ns) | ❌ INCONSISTENT (1,000,000x mismatch with summary) |
| **Replay Snapshot Buckets** | P50, P90, P99 | `benchmark_replays` JSON | Nanoseconds (ns) | ❌ INCONSISTENT (1,000,000x mismatch with summary) |
| **Bot Worker Completed TPS** | TPS | `benchmarks` log | Requests / sec | ✅ ACCURATE (Float duration) |
| **Leaderboard Calculated TPS** | TPS | `leaderboard_entries` DB | Requests / sec | ⚠️ DISTORTED (Integer duration truncation) |
| **Replay Bucket TPS** | TPS | `benchmark_replays` JSON | Requests / sec | ❌ FAKE (`count * 2` hardcoded derivation) |
