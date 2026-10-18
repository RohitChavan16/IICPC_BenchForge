# BenchForge Phase 1 Audit — Service Inventory

**Workstream B: Service and Architecture Verification**

---

## Service Inventory Matrix

| Service | Port | Entry Point | Status | Tests | Key Finding |
|---|---|---|---|---|---|
| api-gateway | 8080 | `cmd/` | **BUILDS** | None | Gin reverse proxy; JWT auth confirmed |
| benchmark-service | 8082 | `cmd/` | **BUILDS** | None | Core orchestration; scoring formula found |
| bot-worker | 8085 | `cmd/worker/` | **BUILDS** | ✅ scenario tests pass | `checkCorrectnessStub` is a stub |
| container-runner | N/A | `cmd/` | **BUILDS** | None | Zip traversal vulnerability |
| deployment-service | 8091 | `cmd/` | **BUILDS** | None | Mounts Docker socket |
| leaderboard-service | 8084 | `cmd/` | **BUILDS** | None | Unverified routes |
| mock-exchange | 9000 | `cmd/` | **BUILDS** | None | Reference implementation |
| submission-service | 8083 | `cmd/` | **BUILDS** | None | ZIP upload handling |
| telemetry-service | 8081 | `cmd/` | **BUILDS** | recovery_test.go | Redis Streams consumer confirmed |

All 9 services: `go build ./...` **PASSES**

---

## Per-Service Deep Dive

### 1. API Gateway (`services/api-gateway/`)

**Entry Point:** `cmd/` (main.go not yet inspected — entry exists)  
**Framework:** Gin (`github.com/gin-gonic/gin` confirmed in `go.mod` and middleware imports)  
**Role:** JWT validation, RBAC, rate limiting, reverse proxy to downstream services

**Confirmed Routes** (`internal/routes/routes.go`):

| Route | Auth | Target |
|---|---|---|
| `GET /health` | None | Local handler |
| `POST /auth/register` | IP rate limit only | auth.AuthHandler.Register (local) |
| `POST /auth/login` | IP rate limit only | auth.AuthHandler.Login (local) |
| `POST /auth/logout` | IP rate limit only | auth.AuthHandler.Logout (local) |
| `GET /auth/me` | IP rate limit only | auth.AuthHandler.Me (local) |
| `ANY /benchmarks/*` | RequireAuth + user rate limit | → benchmark-service:8082 |
| `ANY /submissions/*` | RequireAuth + user rate limit | → submission-service:8083 |
| `ANY /deployments/*` | RequireAuth + user rate limit | → deployment-service:8091 |
| `ANY /history` | RequireAuth + user rate limit | → telemetry-service:8081 |
| `ANY /personas/*` | RequireAuth + user rate limit | → telemetry-service:8081 |
| `ANY /replay/*` | RequireAuth + user rate limit | → telemetry-service:8081 |
| `POST /ticket` | RequireAuth + user rate limit | → telemetry-service:8081 |
| `ANY /leaderboard/*` | IP rate limit (no auth) | → leaderboard-service:8084 |
| `ANY /workers/*` | RequireAuth + RequireRole("admin") | → telemetry-service:8081 |
| `ANY /telemetry/*` | RequireAuth + RequireRole("admin") | → telemetry-service:8081 |
| `ANY /infrastructure/*` | RequireAuth + RequireRole("admin") | → telemetry-service:8081 |

**Auth Implementation** (`internal/middleware/auth.go`):
- Validates HMAC-SHA256 JWT (algorithm check confirmed: `*jwt.SigningMethodHMAC`)
- Performs **live DB lookup** of user by ID on every request — no caching
- Sets `X-User-Id`, `X-Team-Id`, `X-User-Role` headers for downstream services
- Missing: `X-Team-Name` header set (found read in benchmark-service but gateway doesn't set it explicitly — depends on user object)

**Rate Limiting** (`internal/ratelimit/ratelimit.go`): Confirmed configured via env vars.

**Security Gap:** Auth middleware does NOT validate that `X-User-Id`/`X-Team-Id` headers are absent from the original request before injecting them. A client could pre-set these headers; the gateway overwrites them, so this is NOT exploitable — but the pattern relies on downstream trust.

---

### 2. Benchmark Service (`services/benchmark-service/`)

**Entry Point:** `cmd/`  
**Framework:** `gorilla/mux`  
**Role:** Benchmark session lifecycle management, scoring, leaderboard upsert

**Confirmed Routes** (inferred from handlers, routes file not yet read):
- `POST /benchmarks` → `CreateBenchmark`
- `GET /benchmarks` → `ListBenchmarks`
- `GET /benchmarks/{id}` → `GetBenchmarkByID`
- `PATCH /benchmarks/{id}` → `UpdateBenchmarkStatus`
- `PATCH /benchmarks/{id}/heartbeat` → `HeartbeatBenchmark`
- `POST /benchmarks/{id}/stop` → `StopBenchmark`

**Benchmark Queue Mechanism:**
- Uses PostgreSQL `FOR UPDATE SKIP LOCKED` (`repository.go:289-300`)
- Max 1 concurrent benchmark (`benchmarks.go:106`)
- Queue position derived via correlated subquery at read time (confirmed)
- `ProcessQueue()` is called as a goroutine after create, complete, and fail

**Correctness Pre-Validation:**
- Before running the load blast, benchmark-service calls `bot-worker/run-scenario` with 6 predefined scenarios
- Results are scored with weights: basic_resting=15%, basic_matching=15%, partial_fill=15%, price_improvement=20%, fifo_priority=20%, multi_level_sweep=15%
- Score written to `submissions.correctness_score`
- This is the **real** correctness score — CONFIRMED as meaningful

**Scoring Formula** (`leaderboard.go:158-178`):
```go
effectiveTps         = TPS × (SuccessRate / 100.0)
latencyFactor        = 250.0 / (250.0 + P99)
correctnessMultiplier = math.Pow(correctnessScore/100.0, 2)
tracerScore          = concurrencyScore (tracer pass rate × 100)
degradationScore     = 100.0 / (1.0 + math.Pow((P99/max(P50,1))/20.0, 2))
combinedConcurrencyScore = 0.85 × tracerScore + 0.15 × degradationScore
concurrencyMultiplier = math.Pow(combinedConcurrencyScore/100.0, 2)
finalScore           = effectiveTps × latencyFactor × correctnessMultiplier × concurrencyMultiplier
```

**DISCREPANCY:** README formula omits the `degradationScore` blend. The actual formula is more complex than documented.

**Leaderboard ON CONFLICT:** Only updates if `EXCLUDED.final_score > leaderboard_entries.final_score` — CONFIRMED correct.

**Watchdog:** `watchdog.go` — a separate file. Contents not yet fully read. Assumed to handle heartbeat timeout.

**Tests:** NONE

---

### 3. Bot Worker (`services/bot-worker/`)

**Entry Point:** `cmd/worker/`  
**Framework:** Standard `net/http`  
**Role:** Goroutine pool load generator, persona routing, tracer scenario executor, metric publisher

**Routes:**
- `POST /run` → starts goroutine pool benchmark
- `POST /stop` → cancels active benchmark
- `POST /run-scenario` → runs correctness scenarios (called by benchmark-service)

**Worker Pool** (`internal/workers/pool.go`):
- `GenerateDeterministicPersonaMix()` — pre-shuffles personas; confirmed atomic slot claiming
- Persona distribution: Retail 60%, MarketMaker 20%, Scalper 10%, Whale 5%, HFT 5%
- 5% random chance any slot is replaced by Tracer (NOT part of persona mix)
- Tracer sends unique symbol per run (UUID prefix) to avoid order book contamination

**Critical Defect — `checkCorrectnessStub`** (`pool.go:212-218`):
```go
// For Phase 8 stub: Just assume 200 OK means correct for now.
// True correctness engine will be implemented in future phases.
return resp.StatusCode >= 200 && resp.StatusCode < 300
```
This function is used for ALL non-tracer requests. Non-tracer "success" means only HTTP 2xx — not response validation.

**Tracer Scenario** (`pool.go:190-208`):
- BUY 10 @ 100.0 → expect `"resting"` 
- SELL 10 @ 100.0 → expect `"filled"` with exact trade receipt
- This IS a real correctness check for the tracer persona

**Redis Stream Publishing** (`internal/metrics/`):
- Uses `XADD` to publish metric payloads
- Stream name: confirmed (need to read `metrics/publish.go`)

**Tests:** `internal/scenario/executor_test.go` — 4 test functions, all PASSING.

---

### 4. Container Runner (`services/container-runner/`)

**Entry Point:** `cmd/`  
**No HTTP routes** — this is a polling background worker  
**Role:** Polls DB for `UPLOADED` submissions, runs `docker build`, triggers deployment

**Language Detection** (`runner.go:280-292`):
- Detects `go.mod` → Go
- Detects `Cargo.toml` → Rust
- Detects `.cpp/.cc/.cxx/.c` or `CMakeLists.txt` → C++

**Generated Dockerfiles** (`runner.go:294-301`):
```
Go:   golang:alpine → COPY . . → go build -o app ./... → CMD ["/app/app"]
Rust: rust:1.70-slim → cargo build --release → CMD ["/app/target/release/app"]
C++:  buildpack-deps → cmake .. && make → CMD ["/app/build/app"]
```
**Issues with generated Dockerfiles:**
- Go Dockerfile expects `./...` to build a single binary at root — fails for multi-package submissions
- Rust Dockerfile hardcodes `target/release/app` — fails if binary has a different name
- C++ Dockerfile assumes CMake project structure

**Security Vulnerability** (`runner.go:254`):
```go
fpath := filepath.Join(dest, f.Name)
```
No validation that `fpath` stays within `dest`. A crafted ZIP with `../../../etc/cron.d/pwn` extracts to host paths.

**Tests:** NONE

---

### 5. Deployment Service (`services/deployment-service/`)

**Entry Point:** `cmd/`  
**Framework:** Unknown (not yet read)  
**Role:** `docker run` execution, port allocation, health validation

**Confirmed:** Mounts Docker socket (`/var/run/docker.sock`). `deployer.go` is 2306 bytes — not yet read.

**Port allocation:** env vars `DEPLOY_PORT_START=30000`, `DEPLOY_PORT_END=31000`

**Tests:** NONE

---

### 6. Leaderboard Service (`services/leaderboard-service/`)

**Entry Point:** `cmd/`  
**Port:** 8084  
**Role:** Rankings, WebSocket broadcast for leaderboard updates

**Migrations found** — not yet read in detail.

**Tests:** NONE

---

### 7. Mock Exchange (`services/mock-exchange/`)

**Entry Point:** `cmd/`  
**Port:** 9000  
**Role:** Reference trading engine implementation; Prometheus metrics

**Confirmed:** Has its own `go.mod` with Prometheus dependency. Acts as baseline for contestants.

**Tests:** NONE in mock-exchange directory.

---

### 8. Submission Service (`services/submission-service/`)

**Entry Point:** `cmd/`  
**Port:** 8083  
**Role:** ZIP upload, submission record creation, build log streaming

**Migrations:** 9 migration files (001-009)  
**Confirmed tables:** `submissions`, `submission_logs`, `validation_results`

**Tests:** NONE

---

### 9. Telemetry Service (`services/telemetry-service/`)

**Entry Point:** `cmd/`  
**Port:** 8081  
**Role:** Redis Streams XReadGroup consumer, in-memory aggregators, WebSocket broadcaster, Replay Engine

**Redis Consumer** (`internal/consumer/consumer.go`):
- `XReadGroup` with 2s block timeout, batch 100
- Pending message recovery at startup (0-0 cursor)
- 60s recovery loop with `XClaim` for messages idle >5 min
- DLQ (`telemetry_dlq` stream) after 3 failed DB retries
- Idempotency: skips duplicate `request_id` (unique constraint in DB)
- `XAck` called **after** successful DB insert — at-least-once confirmed

**Broadcaster** (`consumer.go:480-635`):
- 1Hz ticker broadcasts JSON snapshot via WebSocket hub
- Snapshot includes: TPS, P50/P90/P99, failure_rate, per-worker, per-persona, tracer_stats
- Pauses when `stopBroadcasterCh` receives (benchmark end)

**Replay Engine** (`internal/aggregator/replay_worker.go`):
- Uses Postgres `PERCENTILE_CONT` window functions — CONFIRMED
- Aggregates into 20 buckets via `FLOOR(((cumulative_requests - 1) * 20.0) / $2::float) + 1`
- **BUG:** `tps := count * 2` — TPS is `requests_in_bucket * 2`, not time-derived
- **BUG:** Lifecycle events (BUILD/DEPLOY/VALIDATION) all use `bmData.StartedAt` — fabricated timestamps

**Tests:** `internal/consumer/recovery_test.go` exists (not yet read in detail)

---

## Architecture Classification

**Verified Classification:** This is a **distributed microservices architecture** with the following characteristics:

✅ 9 separate executable processes  
✅ Independent Docker containers  
✅ HTTP-based inter-service communication (synchronous)  
✅ Redis Streams for async metric pipeline (telemetry path)  
⚠️ **Shared PostgreSQL database** — multiple services access the same schema  
⚠️ **No service mesh, no gRPC** (proto/ directory exists but appears unused for runtime)  
⚠️ **Container-runner has no HTTP server** — it's a polling worker, not an independently addressable service  
⚠️ **Benchmark-service directly queries `submissions` and `deployments` tables** — tables owned by other services

---

## Service Interaction Matrix

| From | To | Mechanism | Purpose | Verified |
|---|---|---|---|---|
| API Gateway | All services | HTTP reverse proxy | Route authenticated requests | ✅ |
| Benchmark Service | Bot Worker | HTTP POST /run | Start load test | ✅ |
| Benchmark Service | Bot Worker | HTTP POST /run-scenario | Correctness validation | ✅ |
| Benchmark Service | Benchmark Service | Postgres FOR UPDATE SKIP LOCKED | Queue dequeue | ✅ |
| Bot Worker | Target Engine | HTTP POST /order | Load generation | ✅ |
| Bot Worker | Redis | XADD telemetry_stream | Metric publish | ✅ (stream name unconfirmed) |
| Bot Worker | Redis | PUBLISH pipeline_logs:* | Log streaming | ✅ |
| Telemetry Service | Redis | XREADGROUP | Metric consume | ✅ |
| Telemetry Service | PostgreSQL | INSERT telemetry_metrics | Metric persist | ✅ |
| Telemetry Service | WebSocket clients | WS broadcast | Live telemetry | ✅ |
| Container Runner | PostgreSQL | Poll submissions | Work discovery | ✅ |
| Container Runner | Docker daemon | exec "docker build" | Build images | ✅ |
| Container Runner | Deployment Service | HTTP POST /deployments | Trigger deploy | ✅ |
| Benchmark Service | Leaderboard | Postgres UPSERT | Write final score | ✅ |
| Frontend | API Gateway | HTTP + WebSocket | All user actions | ✅ (pending detail) |

---

*Report continues in other sections.*
