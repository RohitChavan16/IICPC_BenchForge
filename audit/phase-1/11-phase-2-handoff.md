# BenchForge Phase 1 Audit — Phase 2 Handoff

**Priority questions for Phase 2: Correctness Investigation**

---

## Critical Phase 2 Questions

### Q1: Can a cheating engine score perfectly?
**Background:** `checkCorrectnessStub` returns `true` for any 2xx response. The correctness pre-validation (6 scenarios) happens before the load test and uses the scenario runner in `executor.go` which IS correct.

**Question:** After fixing the stub, what is the minimum engine behavior needed to pass correctness scenarios and achieve 100% success rate during load? Could an engine return `{"order_id":"x","status":"filled","executed_quantity":0,"trades":[]}` to pass?

**Phase 2 Action:** Implement proper response validation and test against minimal-pass engines.

---

### Q2: Are latency percentiles in milliseconds or nanoseconds?

**Background:** Bot-worker measures `time.Since(start)` which returns `time.Duration` (nanoseconds). This is stored as `metric.Latency` (int64). The scoring formula uses P99 in `250/(250+P99)` — if P99 is in nanoseconds, `250ns/(250ns+100ms)` ≈ 0.0025 (almost zero score for any real engine).

**Phase 2 Action:** Trace `metric.Latency` from `pool.go:98,159` through `metrics.PublishMetric()` through Redis through consumer to `database.InsertMetric()` — confirm the unit. Verify against Replay display and scoring formula.

---

### Q3: Are duplicate telemetry events possible and what is their impact?

**Background:** Idempotency is implemented with `ON CONFLICT (request_id) DO NOTHING`. If the same `request_id` arrives twice (e.g., Redis redelivery after ACK failure), the second is silently dropped. However, in-memory aggregators are updated before `XAck` — if the service crashes between aggregator update and `XAck`, the message is redelivered and the in-memory aggregator is updated again, but the DB insert is skipped. This means `snapshot.Total` could exceed actual DB row count.

**Phase 2 Action:** Verify aggregator update order in consumer.go; determine if in-memory TPS can exceed actual DB-stored count.

---

### Q4: Can incomplete benchmarks appear on the leaderboard?

**Background:** Leaderboard upsert only happens when `status == "COMPLETED"` and `targetType == "deployment"`. But what if a benchmark is marked COMPLETED by bot-worker but telemetry hasn't been fully consumed yet?

**Phase 2 Action:** Verify the timing between bot-worker calling `PATCH /benchmarks/{id}` with COMPLETED and telemetry-service finishing all metric ingestion. Is there a race window?

---

### Q5: What happens if the bot-worker crashes mid-benchmark?

**Background:** If bot-worker crashes, there is a 60-second watchdog in benchmark-service that checks `last_heartbeat`. If no heartbeat in 60s, the benchmark is marked ABORTED.

**Phase 2 Action:** Verify `watchdog.go` implementation. Does it mark the benchmark ABORTED correctly? Does it trigger ProcessQueue? Does it trigger replay generation?

---

### Q6: Is the Tracer scenario stateful between concurrent runs?

**Background:** Tracer uses unique symbols `TRC-{uuid[:8]}` to avoid cross-contamination between concurrent tracer runs. But 100 goroutines running concurrently could generate multiple tracers simultaneously. If two tracers use the same symbol on the same exchange, the second BUY would match the first's resting order.

**Phase 2 Action:** Verify UUID generation is sufficiently collision-resistant for the benchmark duration. Verify the mock exchange and sample engine handle concurrent orders correctly.

---

### Q7: Does the scoring formula handle zero duration correctly?

**Background:** If `duration_seconds == 0` (very fast benchmark or DB rounding), `computedTps = 0.0`, making `finalScore = 0`. This could happen for mock-target benchmarks.

**Phase 2 Action:** Verify `execution_time_seconds` vs `duration_seconds` computation in `UpdateBenchmarkStatus`. Determine minimum benchmark duration for non-zero TPS.

---

### Q8: What is the actual Prometheus metrics coverage?

**Background:** Mock exchange exposes Prometheus metrics. README claims all services expose custom metrics. Services import `go.opentelemetry.io/otel` but OTel ≠ Prometheus.

**Phase 2 Action:** Verify which services actually register and expose Prometheus metrics at `/metrics`. Verify Prometheus prometheus.yml scrape targets match actual service addresses.

---

### Q9: Can a submission with 0% correctness score appear on the leaderboard?

**Background:** The leaderboard upsert is skipped if `correctness_score` is NULL (`submissions.correctness_details` or `submissions.correctness_score` must be populated). But if scenario validation fails due to network error, the score defaults to 0.0 (not NULL) — and a 0% correctness score with `math.Pow(0/100, 2) = 0` would produce `finalScore = 0`. A zero-score entry would still appear on the leaderboard.

**Phase 2 Action:** Verify what happens when correctness_score = 0 and totalRequests > 0.

---

### Q10: Are Kubernetes manifests functional?

**Background:** `deployments/kubernetes/` directory exists but was not inspected.

**Phase 2 Action:** Read all Kubernetes manifests; verify they match the Docker Compose service definitions. Check for missing secrets, wrong images, or missing ConfigMaps.

---

## Phase 2 Priority Order

1. **Fix CRITICAL build errors** (BF-P1-010, BF-P1-011) — prerequisite for everything
2. **Latency unit verification** (Q2) — affects all scoring and display
3. **checkCorrectnessStub replacement** (BF-P1-001, Q1) — core benchmark integrity  
4. **Telemetry race conditions** (Q3, Q4) — affects result reliability
5. **Container security** (BF-P1-002, BF-P1-004, BF-P1-005) — security audit
6. **Tracer concurrency correctness** (Q6) — scoring integrity
7. **Zero-edge cases in scoring** (Q5, Q7, Q9) — scoring completeness
8. **Frontend mock data replacement** (BF-P1-017, BF-P1-018) — usability
9. **Prometheus coverage** (Q8) — observability claims verification
10. **Kubernetes manifests** (Q10) — deployment verification

---

## Files Not Inspected in Phase 1 (Carry Forward)

| File/Directory | Priority | Reason Not Inspected |
|---|---|---|
| `services/mock-exchange/internal/` | HIGH | Compilation errors discovered late |
| `services/submission-service/internal/handlers/submissions.go` | HIGH | Compilation errors |
| `services/deployment-service/internal/deployer/deployer.go` | HIGH | Not yet read |
| `services/leaderboard-service/internal/` | MEDIUM | Not yet read |
| `services/benchmark-service/internal/handlers/watchdog.go` | HIGH | Not yet read |
| `deployments/kubernetes/` | MEDIUM | Not yet inspected |
| `deployments/grafana/` | LOW | Not yet inspected |
| `services/bot-worker/internal/metrics/` | HIGH | Stream name unconfirmed |
| `services/telemetry-service/internal/database/` | HIGH | Hardcoded credential confirmed; full query audit needed |
| `proto/` | LOW | gRPC definitions (may be unused) |
| `services/*/internal/tracing/` | LOW | OTel tracing config |
