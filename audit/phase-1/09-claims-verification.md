# BenchForge Phase 1 Audit — Claims Verification Matrix

**Workstream: Cross-Check of README and Documentation Claims**

---

## Claims Verification Matrix

| # | Claim | Expected Evidence | Actual Evidence | Status | Impact |
|---|---|---|---|---|---|
| 1 | "9 Go Microservices" | 9 separate executables with own go.mod | 9 directories, each with cmd/ and go.mod | ✅ VERIFIED | — |
| 2 | "API Gateway using Gin" | gin import in go.mod and routes | `gin-gonic/gin` in gateway go.mod; routes.go uses gin | ✅ VERIFIED | — |
| 3 | "100 Goroutine Workers" | WorkerCount parameter, goroutine pool | pool.go launches `workerCount` goroutines; default 100 | ✅ VERIFIED | — |
| 4 | "6 Trading Personas" | 6 distinct persona implementations | 5 personas in bots.go (Retail, MM, Scalper, Whale, HFT); Tracer is a separate 5% override | ⚠️ PARTIAL — Tracer is not a "persona" in the mix | Minor — accuracy |
| 5 | "Tracer Correctness Validator" | Tracer validates BUY→resting, SELL→filled | `generateTracerScenario()` in pool.go — confirmed | ✅ VERIFIED | — |
| 6 | "20-Bucket Replay Engine" | Postgres window function grouping into 20 buckets | FLOOR(((cumulative_requests-1)*20.0)/$2::float)+1 in replay_worker.go:80 | ✅ VERIFIED | — |
| 7 | "Auto Anomaly Detection" | LATENCY_ANOMALY, RECOVERY, PERSONA_SURGE detection | replay_worker.go:211-243 — all three confirmed | ✅ VERIFIED | — |
| 8 | "Live WebSocket Leaderboard" | WebSocket server + broadcast | WebSocket hub in telemetry-service; 1Hz broadcasts | ✅ VERIFIED | — |
| 9 | "Prometheus + Grafana Stack" | Scrape configs, custom metrics, dashboards | prometheus.yml exists; mock-exchange exports metrics; Grafana in docker-compose | ✅ VERIFIED (basic) | — |
| 10 | "Docker Container Isolation" | Bridge network, no socket access, resource limits | Bridge network: NOT explicitly configured; Docker socket: MOUNTED in 2 services; Resource limits: NONE | ❌ CONTRADICTED | High security |
| 11 | "Docker daemon-level CPU/Memory quotas via cgroups" | `--memory` and `--cpus` flags in docker run | docker-compose.yml has ZERO resource limits | ❌ CONTRADICTED | Critical security |
| 12 | "PostgreSQL Window Functions" | PERCENTILE_CONT in actual query | Confirmed in replay_worker.go:87-89 | ✅ VERIFIED | — |
| 13 | "Graceful Shutdown (all services)" | signal handling in all services | api-gateway confirmed; others not inspected | ⚠️ UNVERIFIED for 8 of 9 | Medium |
| 14 | "Redis Streams at-least-once delivery" | XAck after DB write; recovery on restart | consumer.go:464 XAck after insert; recovery loop confirmed | ✅ VERIFIED | — |
| 15 | "Atomic Persona Distribution" | atomic.AddInt64 on persona slice | pool.go:136 — `atomic.AddInt64(&GlobalPersonaIdx, 1)` | ✅ VERIFIED | — |
| 16 | "React/Next.js frontend" | Next.js package.json, next.config.js | vite.config.ts exists; package.json shows Vite; NO Next.js | ❌ CONTRADICTED (it's Vite/React) | Documentation |
| 17 | "Scoring: TPS × SuccessRate × P99Factor × Correctness² × Concurrency²" | Formula in code matches README | Code adds undocumented 15% degradation blend: `0.85*tracerScore + 0.15*degradationScore` | ⚠️ DISCREPANCY | Medium |
| 18 | "Benchmark Service port 8082" | Port binding | docker-compose.yml:57 — 8082:8082 | ✅ VERIFIED | — |
| 19 | "Deployment Service port 8084" | Port binding | docker-compose.yml:108-109 — 8091:8091. README says 8084 | ❌ CONTRADICTED (port is 8091) | Documentation |
| 20 | "HMAC-SHA256 JWT validation" | Algorithm check in middleware | middleware/auth.go:42 — `*jwt.SigningMethodHMAC` check | ✅ VERIFIED | — |
| 21 | "X-Request-ID propagation across 9 microservices" | X-Request-ID header injection | correlation.go confirmed in gateway; other services not verified | ⚠️ PARTIAL | Low |
| 22 | "P99 measured per bucket; directly penalized in scoring" | Scoring formula uses P99 | leaderboard.go:167 `250/(250+P99)` | ✅ VERIFIED | — |
| 23 | "Leaderboard preserves team's global best (ON CONFLICT)" | ON CONFLICT with conditional | leaderboard.go:145 `WHERE EXCLUDED.final_score > leaderboard_entries.final_score` | ✅ VERIFIED | — |
| 24 | "Build logs streamed to UI in real time" | Redis Pub/Sub log channel | container-runner publishes to `pipeline_logs:{id}`; submission-service WS subscribes | ✅ VERIFIED | — |
| 25 | "10,000–20,000 TPS via 100 goroutines" | Load test results, benchmarks | No runtime evidence available | ❌ UNVERIFIED | Performance claim |
| 26 | "~15,000 metrics/sec ingestion via Redis Streams" | Throughput measurement | No runtime evidence | ❌ UNVERIFIED | Performance claim |
| 27 | "Unlimited WebSocket clients (goroutine-per-connection)" | WS server implementation | Hub architecture exists — per-room goroutines; no connection limit set | ⚠️ PARTIALLY VERIFIED | Scalability claim |
| 28 | "Multi-stage Docker builds under 15MB" | Dockerfile inspection | Gateway Dockerfile uses `golang:alpine`; no scratch image; not inspected all | ⚠️ UNVERIFIED | Performance claim |
| 29 | "Leaderboard tie-breaking: final_score → success_rate → P99 → TPS → created_at" | SQL ORDER BY | leaderboard.go:184 confirms cascade | ✅ VERIFIED | — |
| 30 | "Correctness: 90% correctness → 81% score multiplier" | (0.9)² = 0.81 | Math confirmed; implementation uses this formula | ✅ VERIFIED | — |
| 31 | "Container-runner uses for UPDATE SKIP LOCKED" | No — it does NOT | runner.go:44-59 uses plain SELECT with no locking | ❌ CONTRADICTED (implied by arch) | High reliability |
| 32 | "Mock Exchange exposes Prometheus metrics" | /metrics endpoint with custom counters | mock-exchange has Prometheus import; implementation broken due to compile error | ⚠️ UNVERIFIED (compile error) | — |
| 33 | "Kubernetes Migration in 6-month roadmap" | Kubernetes manifests | deployments/kubernetes/ directory exists but not inspected | ⚠️ UNVERIFIED | Future |
| 34 | "No external internet egress from contestant containers" | Network policy | No network restrictions in docker-compose.yml or deployer | ❌ CONTRADICTED | Critical security |

---

## Contradiction Summary

| # | Contradicted Claim | Severity |
|---|---|---|
| 11 | "Docker daemon-level CPU/Memory quotas" | 🔴 CRITICAL |
| 10 | "Container isolation with no socket access" | 🔴 CRITICAL |
| 34 | "No external internet egress" | 🔴 CRITICAL |
| 16 | "React/Next.js frontend" | 🟡 MEDIUM (just wrong framework name) |
| 19 | "Deployment Service port 8084" | 🟡 MEDIUM |
| 31 | Implied queue safety in container-runner | 🟠 HIGH |
| 17 | Scoring formula (undocumented blend) | 🟠 HIGH |
