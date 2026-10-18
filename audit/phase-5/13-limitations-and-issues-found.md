# BenchForge Phase 5 — Limitations & Issues Found

**Audit Date:** 2026-10-17  
**Scope:** Systematic register of evidence gaps, architectural limitations, unverified claims, and out-of-scope defects identified during Phase 5.  
**Auditor:** Independent Technical Auditor & Strategist (Phase 5)

---

## 1. Limitations & Evidence Gaps Register

This register documents all issues, evidence boundaries, and missing runtime capabilities identified during the Phase 5 product validation, distinct from previous technical registers.

| Issue ID | Category | Severity | Description & Architectural Location | Evidence & Source Basis | Real-World Impact | Recommended Action |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **BF-P5-001** | Evidence Gap | **Critical** | **Zero External Customer Validation**: No commercial customer interviews, willingness-to-pay surveys, or live competition pilots have been conducted to date. | Workstream B, H analysis; repository lacks user feedback records. | High risk of building features that no real user needs or wants. | Execute Experiment 1 (Problem Discovery Interviews) with 10 trading club leaders before writing new code. |
| **BF-P5-002** | Security / Sandbox | **Critical** | **Contestant Docker-in-Docker Network Isolation Missing**: While internal services communicate over Docker bridge, dynamically spawned contestant containers share the network bridge with PostgreSQL (5432) and Redis (6379). | `deployment-service/internal/deployer/deployer.go:17-25` | Untrusted submission can open direct TCP socket to database and truncate tables or inject fake metrics. | Create an isolated internal network (`--network none` or isolated egress-less bridge) for contestant containers. |
| **BF-P5-003** | Architecture / Scale | **High** | **Global Benchmark Execution Serialization Bottleneck**: `benchmark-service` hardcodes `MAX_CONCURRENT_BENCHMARKS = 1`. In a contest with 50 teams submitting before a deadline, submissions queue serially, creating a 25+ minute backlog. | `benchmark-service/internal/handlers/benchmarks.go:106` | Unusable for real-time hackathons with dozens of concurrent teams. | Parameterize concurrency limit; implement a dynamic worker pool dispatcher. |
| **BF-P5-004** | Measurement Integrity | **High** | **Arbitrary 5000ms Failure Penalty Injected into Latency Histograms**: When requests fail or timeout, `bot-worker` injects `5000.0ms` directly into the latency histogram rather than tracking errors separately. | `bot-worker/cmd/worker/main.go:293` | 2% request failure rate mathematically forces P99 to 5,000ms, distorting response time analysis. | Isolate latency histograms strictly to successful operations; track error rate as an independent ratio. |
| **BF-P5-005** | Metric Integrity | **High** | **Duration Truncation to Integer Seconds in Leaderboard Queries**: `benchmarks.duration_seconds` is stored as an `INTEGER`. Runs under 1.0s score 0.0 TPS; fractional runs receive up to 90% artificial score inflation. | `benchmark-service/internal/repository/leaderboard.go:97-105` | Short benchmarks produce wildly distorted throughput and final scores. | Migrate database column to `NUMERIC(10,4)` and use floating-point math in Go. |
| **BF-P5-006** | Workload Fidelity | **Medium** | **Complete Absence of Order Cancellations and Market Orders**: Workload generator only issues limit orders (`BUY`/`SELL` with price). Cancellation endpoints and market execution are not modeled. | `bot-worker/internal/bots/bots.go:34-135` | Trading engines with severe memory leaks or locking flaws in order cancellation are never exposed. | Add `CANCEL` and `MARKET` order types and personas to `bots.go`. |
| **BF-P5-007** | Operational Usability | **Medium** | **Permanent Queue Starvation upon Manual Benchmark Cancellation**: Cancelling a running benchmark via `StopBenchmark` updates status to `CANCELLED` but fails to trigger `ProcessQueue()`. | `benchmark-service/internal/handlers/benchmarks.go:142-160` | Queue halts indefinitely; operator must manually restart service to restore benchmarking. | Add `go h.ProcessQueue()` immediately after the status update SQL query. |
| **BF-P5-008** | Build & Deployment | **Medium** | **Non-Existent Base Images and Un-orchestrated Database Migrations**: Dockerfiles specify `golang:1.26` and repository lacks an automated migration runner. | `services/*/Dockerfile`, directory scan | Platform cannot be deployed out-of-the-box via `docker compose up` without manual developer patches. | Downgrade Dockerfiles to `golang:1.22` and integrate `golang-migrate` into service entrypoints. |
| **BF-P5-009** | Security / Auth | **Medium** | **Downstream Microservices Expose Unauthenticated Ports on `0.0.0.0`**: Ports 8081–8085 and 8091 are bound to all host interfaces without JWT middleware. | `docker-compose.yml:25-95` | Anyone on local network or cloud VPC can bypass API Gateway and invoke internal service APIs directly. | Remove public host port bindings in Docker Compose; route strictly via Docker internal DNS. |
| **BF-P5-010** | UI / Data Fidelity | **Medium** | **Fabricated Replay Throughput and Timeline Timestamps**: Replay TPS is hardcoded as `count * 2` and all lifecycle stage events receive identical `StartedAt` timestamps. | `telemetry-service/internal/aggregator/replay_worker.go:126,267` | Visual replay curves and lifecycle timelines are cosmetic and misleading. | Derive TPS from actual bucket timestamps and query real phase transition timestamps from runner logs. |

---

## 2. Summary of Strategic Implications

1. **The Core Technical Blockers Are Solvable**: None of the technical defects require fundamental reinvention of distributed systems theory. They are solvable bugs (batching SQL inserts, closing HTTP bodies, checking path prefixes, parameterizing queue limits, using microsecond HdrHistograms).
2. **The Strategic Blocker is Commercial Mismatch**: The unsolvable issue is that institutional financial firms will never buy an HTTP-based testing platform, and student hackathons will not pay enterprise SaaS prices.
3. **Actionable Direction**: Focus engineering effort exclusively on fixing the build, security, and metric bugs necessary to make BenchForge a bulletproof open-source portfolio piece and collegiate competition evaluator.
