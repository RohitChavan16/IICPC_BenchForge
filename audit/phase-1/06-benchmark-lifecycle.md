# BenchForge Phase 1 Audit — Benchmark Lifecycle Map

**Workstream D: Benchmark and Scoring Implementation**

---

## Complete Benchmark Lifecycle Trace

### Step 1: User Creates Benchmark
**Action:** `POST /benchmarks` via API Gateway  
**File:** `services/api-gateway/internal/routes/routes.go:51`  
**Handler:** Proxied to → `benchmark-service:8082/benchmarks`  
**Handler:** `BenchmarkHandler.CreateBenchmark` (`benchmarks.go:400`)

**Validation:**
- Body must contain `name` (required)
- `targetType` must be `"mock"` or `"deployment"` (defaults to `"mock"`)
- If `"deployment"`: `submissionId` and `deploymentId` required
- `workerCount` defaults to 100, `totalRequests` defaults to 1000

**Persistence:** `repository.CreateBenchmark()` — INSERT into `benchmarks` table with `status='QUEUED'`  
**Immediate Action:** `go h.ProcessQueue()` called as goroutine

---

### Step 2: Queue Processing
**Function:** `BenchmarkHandler.ProcessQueue()` (`benchmarks.go:100`)

```
CountRunningBenchmarks() → if count >= 1: abort (max 1 concurrent)
DequeueNextBenchmark() → FOR UPDATE SKIP LOCKED → transitions status to 'RUNNING'
```

**Compute target URL:**
- If `targetType == "mock"`: `http://mock-exchange:9000`
- If `targetType == "deployment"`: queries `SELECT container_port FROM deployments WHERE id=$1`
- Target URL: `http://deployment-{id}:{port}`

**⚠️ Issue:** Deployment container is addressed as `deployment-{UUID}` — this relies on Docker container naming. If the container name doesn't match this pattern, the benchmark has no valid target.

---

### Step 3: Correctness Pre-Validation (Sequential, Blocking)
**Function:** HTTP POST to `bot-worker:8085/run-scenario` (`benchmarks.go:261`)

**Scenarios Sent:**
1. `basic_resting_order` (weight: 15%) — BUY 100 AAPL @ $150
2. `basic_matching_order` (weight: 15%) — BUY 50 MSFT → SELL 50 MSFT
3. `partial_fill_order` (weight: 15%) — BUY 100 AMZN → 2× SELL 50
4. `price_improvement` (weight: 20%) — BUY 10 TSLA @ $100 → SELL @ $90 (fills at $100)
5. `fifo_priority` (weight: 20%) — Two resting orders → SELL fills in order
6. `multi_level_price_sweep` (weight: 15%) — 3 sell levels → single buy sweeps all

**Scoring:** `(sum_of_passed_weights / max_possible_weight) × 100`  
**Stored:** `UPDATE submissions SET correctness_score=$1` (`benchmarks.go:322`)

**`CONTRACT_NOT_SUPPORTED` Handling:** If engine returns old `{"status":"accepted","latency":12}` format, scenarios return `CONTRACT_NOT_SUPPORTED`. This is logged as "Legacy submission" and correctness stays `0.0`.

**⚠️ Important:** The old API contract documented in the README (`{"status":"accepted","latency":12}`) is now a failure path — the platform requires the new V1 API.

---

### Step 4: Load Test Execution
**Function:** HTTP POST to `bot-worker:8085/run` (`benchmarks.go:387`)

**Payload:**
```json
{
  "benchmarkId": "<uuid>",
  "targetUrl": "http://deployment-{id}:{port}",
  "workerCount": 100,
  "totalRequests": 1000,
  "submissionId": "<uuid>",
  "token": "<worker-jwt>",
  "traceId": "<string>",
  "traceContext": {},
  "seed": 0
}
```

**Worker Pool Startup** (`pool.go`):
1. `GenerateDeterministicPersonaMix(totalRequests, seed)` — builds shuffled array
2. Spawns `workerCount` goroutines, each consuming from `jobs` channel
3. `totalRequests` jobs pushed to channel

**Per-Request Logic** (each goroutine, `pool.go:74-187`):
```
5% random chance → run Tracer scenario (sequential, blocking)
95% → pick persona from deterministic mix via atomic.AddInt64
      → build order params
      → POST to targetURL/order (5s timeout)
      → checkCorrectnessStub(resp) ← STUB: returns true for 2xx
      → publish metric to Redis (XADD)
      → send metric to results channel
```

---

### Step 5: Metric Publication to Redis Streams
**Function:** `metrics.PublishMetric()` (in `internal/metrics/`)  
**Stream:** XADD to `telemetry_stream` (need to verify exact stream name)  
**Payload:** JSON-serialized `RequestMetric` struct

---

### Step 6: Telemetry Service Consumption
**Function:** `consumer.StartConsumer()` (`consumer.go:45`)

**Flow:**
1. `XReadGroup` blocks up to 2s for messages from stream
2. JWT token in metric validated against `WORKER_SECRET`
3. `database.InsertMetric()` with `ON CONFLICT (request_id) DO NOTHING` (idempotent)
4. If inserted: update in-memory aggregators (global, per-worker, per-persona)
5. `XAck` sent **after** successful insert
6. If insert fails: retry up to 3 times, then DLQ

---

### Step 7: Live Broadcast
**Goroutine:** `startBroadcaster()` (`consumer.go:480`)

- 1Hz ticker fires snapshot
- Snapshot includes: TPS, P50/P90/P99, per-worker, per-persona, tracer stats
- `hub.Broadcast("GLOBAL", data)` → all connected WebSocket clients

---

### Step 8: Benchmark Completion
**Trigger:** Bot Worker calls `PATCH /benchmarks/{id}` with final metrics

**Payload:**
```json
{
  "status": "COMPLETED",
  "totalRequests": N,
  "successCount": N,
  "failureCount": N,
  "p50": ..., "p90": ..., "p99": ...,
  "tracerTotal": ..., "tracerSuccess": ...
}
```

**Handler:** `UpdateBenchmarkStatus` (`benchmarks.go:514`)

**Post-completion:**
1. If status == COMPLETED and target == deployment:
   - Checks `submissions.correctness_score` is populated
   - If yes: calls `repository.UpsertLeaderboardEntryFromBenchmark(db, id)`
   - If no: skips leaderboard upsert (logged as warning)
2. `go h.ProcessQueue()` — next queued benchmark starts

---

### Step 9: Scoring Computation
**Function:** `repository.UpsertLeaderboardEntryFromBenchmark()` (`leaderboard.go:55`)

**Data JOIN:**
```sql
SELECT b.total_requests, b.success_count, b.p50, b.p90, b.p99,
       COALESCE(b.execution_time_seconds, b.duration_seconds),
       b.deployment_id, b.tracer_total, b.tracer_success,
       s.team_name, s.id, s.submission_name, s.correctness_score
FROM benchmarks b
JOIN deployments d ON b.deployment_id = d.id
JOIN submissions s ON d.submission_id = s.id
WHERE b.id = $1
```

**Score Computation** (all in Go, `leaderboard.go:158-178`):
```
TPS                 = totalRequests / duration_seconds
successRate         = (successCount / totalRequests) × 100
effectiveTPS        = TPS × (successRate / 100)
latencyFactor       = 250 / (250 + P99_ms)
correctnessScore    = submissions.correctness_score (scenario-weighted)
concurrencyScore    = (tracerSuccess / tracerTotal) × 100  [default 100 if no tracers]
degradationScore    = 100 / (1 + ((P99/max(P50,1))/20)²)
combinedConcurrency = 0.85 × concurrencyScore + 0.15 × degradationScore
finalScore          = effectiveTPS × latencyFactor × (correctness/100)² × (combinedConcurrency/100)²
```

**Upsert:** ON CONFLICT (normalized_team_name) → only update if new score > existing score

---

### Step 10: Rank Recalculation
**Function:** `updateLeaderboardRanks()` (`leaderboard.go:181`)

```sql
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    ORDER BY final_score DESC, success_rate DESC, p99 ASC, tps DESC, created_at ASC
  ) AS rank_value
  FROM leaderboard_entries
)
UPDATE leaderboard_entries SET rank = ranked.rank_value ...
```

Tie-breaking cascade: final_score → success_rate → P99 → TPS → created_at (CONFIRMED matches README)

---

### Step 11: Replay Generation
**Trigger:** Bot Worker publishes a `system_control` message with `bot_type="system_control"` and `worker_id="STOP_STREAM"` at benchmark end

**Function:** `aggregator.GenerateReplay()` (`replay_worker.go:26`)

**Postgres Window Function Query:**
```sql
WITH cumulative AS (
  SELECT latency, success, bot_type, created_at,
         COUNT(*) OVER (ORDER BY created_at) as cumulative_requests
  FROM telemetry_metrics WHERE benchmark_id = $1
),
bucketed AS (
  SELECT latency, success, bot_type,
         FLOOR(((cumulative_requests - 1) * 20.0) / $2::float) + 1 as bucket
  FROM cumulative
)
SELECT bucket,
       COUNT(*) as requests_processed,
       SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency) as p50,
       PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY latency) as p90,
       PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency) as p99
FROM bucketed GROUP BY bucket ORDER BY bucket
```

**Issues:**
1. `tps := count * 2` — TPS is not time-derived (`replay_worker.go:126`)
2. BUILD/DEPLOY/VALIDATION lifecycle timestamps all copied from `bmData.StartedAt` (`replay_worker.go:270-275`)
3. Persona distribution added in second query but persona distribution NOT included in bucket stats shown to user (it's in the data structure but the TPS per persona is also `count * 2`)

---

## Metric/Scoring Edge Cases Requiring Phase 2 Investigation

| Edge Case | Risk | Location |
|---|---|---|
| `tracerTotal == 0` → `concurrencyScore = 100.0` default | Score inflation for short benchmarks | `leaderboard.go:118` |
| `duration_seconds == 0` → `TPS = 0.0` | Short benchmark scores 0 | `leaderboard.go:102` |
| P99 stored in milliseconds or nanoseconds? | Latency factor calculation depends on unit | Consumer stores `metric.Latency` — unit unclear |
| `correctnessScore = 0.0` when no scenario runs | Zero × anything = 0. But what if bot-worker unreachable? Benchmark completes with 0 correctness, no leaderboard entry | `benchmarks.go:329-334` |
| Duplicate benchmark run by same team | Scores are max-preserved by ON CONFLICT. Second run with lower score doesn't appear. New higher scores would overwrite. Correct. | `leaderboard.go:145` |
| Non-deployment benchmarks (targetType="mock") | Never upsert to leaderboard — only deployment targets score | `benchmarks.go:578` |
