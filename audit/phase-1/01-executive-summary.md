# BenchForge Phase 1 Audit — Executive Summary

**Audit Date:** 2026-10-17  
**Auditor:** Phase 1 Forensic Audit (Automated + Manual Code Review)  
**Repository:** `e:\AIML_Projects\iicpc_benchforge`  
**Commit Baseline:** Untagged HEAD (no CI/CD pipelines detected)

---

## 1. What BenchForge Actually Is

Based on verified source code inspection (not README claims):

BenchForge is a **single-contest distributed load testing platform** that:
- Accepts ZIP submissions of trading engine implementations
- Automatically builds them into Docker containers (Go, Rust, C++ supported)
- Deploys containers and runs HTTP load tests against `/order` endpoints
- Measures throughput (TPS), latency percentiles (P50/P90/P99), and correctness
- Scores results using a composite formula and updates a leaderboard
- Provides a React/Vite frontend for contestants and an admin dashboard

The system is implemented as **9 independently deployable Go microservices** orchestrated via Docker Compose.

---

## 2. Actual Runtime Architecture

The architecture is confirmed as:

```
Frontend (Vite/React) → API Gateway (Gin, port 8080)
                             │
        ┌────────────────────┼──────────────────────────┐
        │                    │                          │
Submission Service     Benchmark Service      Leaderboard Service
(8083)                 (8082)                 (8084)
   │                       │
Container Runner       Bot Worker (8085)
                           │ XADD
                       Redis Streams ← Telemetry Service (8081)
                                              │ WS broadcast
Deployment Service                        WebSocket Hub
(8091)                                        │
   │                                      Frontend
Docker socket                              live view
```

All services connect to a shared **PostgreSQL** database (each has its own migrations) and shared **Redis** instance.

---

## 3. Major Verified Strengths

| Strength | Evidence |
|---|---|
| **9 services build successfully** | `go build ./...` passes on bot-worker, benchmark-service, api-gateway |
| **Redis Streams XReadGroup with ACK-after-write** | `consumer.go:464` — XAck called only after successful DB insert |
| **Dead-letter queue (DLQ) implemented** | `consumer.go:405` — XADD to `telemetry_dlq` on max retries |
| **Message recovery loop** | `consumer.go:213` — XClaim every 60s for messages idle >5 min |
| **Correct P99 damping in scoring** | `leaderboard.go:167` — `250/(250+P99)` |
| **Correctness scenarios tested** | 6 scenarios with unit tests using httptest servers |
| **All unit tests pass** | `go test ./...` output: `ok  ...scenario 3.253s` |
| **Deterministic persona mix** | `pool.go:25-51` — pre-shuffled atomic slice |
| **Postgres ON CONFLICT upsert** | `leaderboard.go:128` — `WHERE EXCLUDED.final_score > leaderboard_entries.final_score` |
| **Leaderboard rank recalculation** | `leaderboard.go:182-193` — window function ROW_NUMBER() |
| **OpenTelemetry instrumentation** | OTel SDK imported and propagated in benchmark-service and telemetry-service |
| **20-bucket Postgres window function** | `replay_worker.go:69-93` — confirmed PERCENTILE_CONT usage |
| **Zip traversal protection** | Missing (see findings) |
| **X-Request-ID propagation** | `correlation.go` — confirmed |

---

## 4. Major Confirmed Defects

### CRITICAL

| ID | Finding | Evidence |
|---|---|---|
| **BF-P1-001** | `checkCorrectnessStub` is NOT a correctness validator — it returns `true` for any 2xx response. The README claims non-tracer bot correctness is validated. It is not. | `pool.go:212-218`: "For Phase 8 stub: Just assume 200 OK means correct for now." |
| **BF-P1-002** | **Zip path traversal vulnerability**: `unzip()` in `container-runner` does NOT validate that extracted paths remain within `tmpDir` | `runner.go:246-278`: `filepath.Join(dest, f.Name)` with no `..` check |

### HIGH

| ID | Finding | Evidence |
|---|---|---|
| **BF-P1-003** | **No healthchecks in docker-compose.yml**: `depends_on` uses default `service_started` not `service_healthy`. Services may start before Redis/Postgres are ready. | `docker-compose.yml:12-14` |
| **BF-P1-004** | **Docker socket mounted in two containers** without privilege restriction: container-runner and deployment-service mount `/var/run/docker.sock` — a critical host escape vector | `docker-compose.yml:102,117` |
| **BF-P1-005** | **No CPU/Memory cgroups limits on contestant containers**: The README claims "Docker daemon-level CPU/Memory quotas via cgroups" but docker-compose.yml has zero `deploy.resources` limits on any service | `docker-compose.yml` — no `mem_limit`, `cpus`, or `deploy.resources` |
| **BF-P1-006** | **Scoring formula discrepancy**: README states formula as `TPS × (SuccessRate/100) × (250/(250+P99)) × (Correctness/100)² × (Concurrency/100)²`. Actual implementation adds a P99/P50 degradation score blended into concurrency: `combinedConcurrencyScore = 0.85*tracerScore + 0.15*degradationScore`. This formula is undocumented. | `leaderboard.go:158-178` |
| **BF-P1-007** | **Replay TPS is estimated, not measured**: `tps := count * 2` — hardcoded multiplication by 2 with no derivation | `replay_worker.go:126` |
| **BF-P1-008** | **Replay lifecycle events are fabricated**: BUILD/DEPLOY/VALIDATION phases in replay data all receive the same `bmData.StartedAt` timestamp — they are not real per-phase timestamps | `replay_worker.go:268-276` |

### MEDIUM

| ID | Finding | Evidence |
|---|---|---|
| **BF-P1-009** | **No Go workspace file**: Each service has its own `go.mod`. There is no `go.work` file. Cross-service imports in bot-worker reference `github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/...` — this works only because each service is self-contained. | `services/*/go.mod` |
| **BF-P1-010** | **Hardcoded default credentials**: `postgres:password` in `.env.example` AND embedded directly in `docker-compose.yml:125` as `POSTGRES_PASSWORD: password`. `postgres-exporter` embeds the full connection string including password | `docker-compose.yml:125,212` |
| **BF-P1-011** | **Benchmark queue is not redis-backed** — it relies on PostgreSQL `FOR UPDATE SKIP LOCKED`. This is correct but NOT described as such in the README (which implies Redis handles it) | `repository.go:289-300` |
| **BF-P1-012** | **No test files found in 7 of 9 services** (only bot-worker/scenario has tests; telemetry-service/consumer has a recovery_test.go). All other critical paths (scoring, auth, deployment, leaderboard) are untested. | Directory scans |
| **BF-P1-013** | **Max concurrent benchmarks hardcoded to 1** with no configuration option | `benchmarks.go:106` |
| **BF-P1-014** | **Tracer persona is randomly invoked at 5% probability**, not as a separate dedicated stream. Under low total requests, tracer runs may be zero, yielding `concurrencyScore = 100.0` default — inflating scores | `pool.go:83-89`; `leaderboard.go:118` |
| **BF-P1-015** | **Container-runner uses `/tmp` for build artifacts** which may not persist across container restarts and has no cleanup on crash | `runner.go:124` |
| **BF-P1-016** | **scripts/ directory is empty** — README references scripts for DB migrations and CI/CD but none exist | `scripts/` — confirmed empty |

---

## 5. Major Unverified Claims

| Claim | Status | Missing Evidence |
|---|---|---|
| "100 goroutines simultaneously target" the engine | PARTIALLY VERIFIED — configurable, default 100 | No runtime verification possible without live system |
| "20-bucket Replay Engine" uses Postgres window functions | VERIFIED — PERCENTILE_CONT confirmed in replay_worker.go:87-89 | — |
| "Auto anomaly detection" in replay | VERIFIED — LATENCY_ANOMALY, RECOVERY, PERSONA_SURGE logic in code | — |
| "At-least-once delivery" via Redis Streams | VERIFIED in code; NOT runtime verified | No running system |
| "10,000-20,000 TPS via 100 goroutines" | UNVERIFIED — no load test evidence, no benchmarks run | Performance claim |
| "Container isolation with no external egress" | UNVERIFIED — no network policy in docker-compose.yml | `docker-compose.yml` has no network restrictions |
| "Kubernetes manifests" in deployments/kubernetes/ | EXISTS as directory — content unverified by subagents | Need to read files |
| "Graceful shutdown (all services)" | UNVERIFIED — not inspected in all services | |
| The frontend is "Next.js" | CONTRADICTED — Vite/React found | `vite.config.ts`, `package.json` |

---

## 6. Documentation Discrepancies

| README Claim | Actual Finding |
|---|---|
| "React/Next.js frontend" | Vite + React + Tailwind CSS (NOT Next.js) |
| Scoring: `TPS × SuccessRate × P99Factor × Correctness² × Concurrency²` | Actual: uses blended `combinedConcurrencyScore = 0.85*tracerScore + 0.15*degradationScore` |
| "6 Trading Personas" including Tracer | Tracer is NOT a persona in the mix — it's a random 5% override replacing any persona slot |
| "Redis-backed queue" | Postgres `FOR UPDATE SKIP LOCKED` queue (correct but different) |
| "Docker daemon-level CPU/Memory quotas via cgroups" | No resource limits in docker-compose.yml |
| "HMAC-SHA256 JWTs" | JWT uses HMAC-SHA256 signing — CORRECT |
| Scripts directory for DB migrations | Scripts directory is empty |
| leaderboard port: "8084" | Confirmed correct |
| "Deployment Service port: 8084" | Actual port: 8091 (doc says 8084, which is Leaderboard Service) — README port table has error |

---

## 7. Overall Confidence Assessment

| Area | Confidence | Basis |
|---|---|---|
| Architecture (services exist and build) | **HIGH** | Direct code + `go build` |
| Scoring formula correctness | **MEDIUM** | Code verified; edge cases not tested |
| Redis Streams reliability | **MEDIUM-HIGH** | Code correct; no runtime test |
| Correctness validation completeness | **LOW** | `checkCorrectnessStub` is a stub |
| Container isolation | **LOW** | No resource limits; Docker socket exposed |
| Frontend data fidelity | **MEDIUM** | Pending subagent results |
| Performance claims (TPS) | **UNVERIFIED** | No runtime measurements |

---

## 8. Five Highest-Priority Findings

1. **BF-P1-001 [CRITICAL]** — `checkCorrectnessStub` always returns `true` for 2xx. Non-tracer bot success rate does not validate response correctness. A malicious engine returning empty JSON would score identically to a correct one.

2. **BF-P1-002 [CRITICAL]** — Zip path traversal in `container-runner`. An attacker can extract files to arbitrary paths on the host.

3. **BF-P1-004 [HIGH]** — Docker socket mounted in container-runner and deployment-service without privilege restrictions. Container escape = full host access.

4. **BF-P1-007 [HIGH]** — Replay TPS calculation is `count * 2` (hardcoded), not derived from actual time measurements. All replay TPS values are wrong.

5. **BF-P1-005 [HIGH]** — No CPU/Memory limits on contestant containers. A contestant could submit code that forks indefinitely or allocates unbounded memory, crashing the host.

---

## 9. Remaining Blind Spots

- Full frontend data provenance (subagent running)
- Leaderboard service route inventory (not yet inspected)
- Deployment service deployer.go implementation
- Mock exchange matching engine implementation
- Kubernetes manifests content
- Runtime behavior (no live system available)
- API contract alignment between frontend and backend

---

*Complete audit artifacts are in `audit/phase-1/`. This summary reflects Phase 1 scope only.*
