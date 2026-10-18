# BenchForge Phase 1 Audit — Findings Register

**All findings from Phase 1 forensic audit. Every finding is evidence-backed.**

---

## Severity Definitions
- **CRITICAL**: Invalidates core results, enables compromise, or makes main workflow unusable
- **HIGH**: Major correctness, security, architecture, or reliability issue
- **MEDIUM**: Meaningful limitation, missing validation, or maintainability concern
- **LOW**: Minor defect, cleanup opportunity, or non-blocking inconsistency

---

## BF-P1-001 — `checkCorrectnessStub` Is a Stub — Non-Tracer Correctness Not Validated

**Severity:** CRITICAL  
**Confidence:** CONFIRMED  
**Category:** Correctness / Benchmark Integrity  
**Status:** Open

**Evidence:**  
`services/bot-worker/internal/workers/pool.go:210-218`
```go
// checkCorrectnessStub is a placeholder for validating the exchange's response payload
// e.g., verifying that order fills, balances, or order books are mathematically sound.
func checkCorrectnessStub(resp *http.Response) bool {
    if resp == nil {
        return false
    }
    // For Phase 8 stub: Just assume 200 OK means correct for now.
    // True correctness engine will be implemented in future phases.
    return resp.StatusCode >= 200 && resp.StatusCode < 300
}
```

**Impact:** 95% of bot requests (all non-tracer personas) mark `success = true` for any 2xx HTTP response. An engine returning `{"foo":"bar"}` or an empty body scores identically to a correctly matching engine. The `success_count` stored in the benchmarks table is misleading — it's an HTTP 2xx count, not a correctness count.

**Expected Behavior:** Response payload should be validated for order status, trades, executed quantity.  
**Recommended Action:** Phase 2 — implement actual response validation.

---

## BF-P1-002 — Zip Path Traversal Vulnerability in Container Runner

**Severity:** CRITICAL  
**Confidence:** CONFIRMED  
**Category:** Security  
**Status:** Open

**Evidence:**  
`services/container-runner/internal/runner/runner.go:253-254`
```go
for _, f := range r.File {
    fpath := filepath.Join(dest, f.Name)
```
No check that `fpath` remains within `dest` after joining. A zip entry with `f.Name = "../../../etc/cron.d/pwn"` extracts to the host filesystem (Docker socket is mounted; host access is possible).

**Reproduction Steps:**
1. Craft a ZIP containing an entry named `../../../../etc/cron.d/malicious`
2. Upload as a submission
3. Container runner extracts to host path

**Recommended Action:** Add check: `if !strings.HasPrefix(fpath, filepath.Clean(dest)+string(os.PathSeparator)) { return error }`

---

## BF-P1-003 — No Docker Compose Healthchecks — Race Condition on Startup

**Severity:** HIGH  
**Confidence:** CONFIRMED  
**Category:** Reliability / Deployment  
**Status:** Open

**Evidence:**  
`docker-compose.yml:12-14` — `depends_on: - redis - postgres` uses default `service_started` condition. Services start immediately after container creation, not after the database or Redis is ready to accept connections.

**Impact:** On `docker compose up`, benchmark-service, telemetry-service, and other services may attempt DB connections before Postgres finishes initialization, causing startup errors requiring manual restart.

**Recommended Action:** Add `healthcheck` to postgres and redis services; use `condition: service_healthy` in `depends_on`.

---

## BF-P1-004 — Docker Socket Mounted Without Privilege Restriction

**Severity:** HIGH  
**Confidence:** CONFIRMED  
**Category:** Security  
**Status:** Open

**Evidence:**  
`docker-compose.yml:100-102` (container-runner):
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock # optional: allows docker build (host dind)
```
`docker-compose.yml:116-117` (deployment-service):
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

**Impact:** Any code running inside either container has full Docker API access — equivalent to root on the host. If contestant code escapes the submitted container, it can create privileged containers, mount the host filesystem, or exfiltrate host secrets.

**Recommended Action:** Use Docker-in-Docker (DinD) with TLS, or restrict socket access with `socket-proxy` (Tecnativa). Apply `read_only: true` where possible.

---

## BF-P1-005 — No CPU/Memory Resource Limits on Contestant Containers

**Severity:** HIGH  
**Confidence:** CONFIRMED  
**Category:** Security / Reliability  
**Status:** Open

**Evidence:**  
`docker-compose.yml` — zero instances of `mem_limit`, `cpus`, `deploy.resources.limits`. The README claims "Docker daemon-level CPU/Memory quotas via cgroups prevent noisy-neighbor attacks" — this is directly contradicted by the deployment configuration.

**Impact:** A contestant can submit code that forks a bomb, allocates all available RAM, or saturates CPU — taking down the entire benchmarking host.

**Recommended Action:** Add to deployment-service's `docker run` call: `--memory 512m --cpus 1.0 --pids-limit 128`.

---

## BF-P1-006 — Scoring Formula Discrepancy Between README and Implementation

**Severity:** HIGH  
**Confidence:** CONFIRMED  
**Category:** Correctness / Documentation  
**Status:** Open

**Evidence:**  
README states: `Score = TPS × (SuccessRate/100) × (250/(250+P99)) × (Correctness/100)² × (Concurrency/100)²`

Actual implementation (`leaderboard.go:158-178`):
```go
degradationScore := 100.0 / (1.0 + math.Pow(ratio/20.0, 2))  // ratio = P99/max(P50,1)
combinedConcurrencyScore := (0.85 * tracerScore) + (0.15 * degradationScore)
concurrencyMultiplier := math.Pow(combinedConcurrencyScore/100.0, 2)
```

The 15% degradation score blend is absent from documentation. This means two engines with identical tracer pass rates but different P99/P50 ratios receive different concurrency scores — undocumented behavior.

**Recommended Action:** Update README to reflect actual formula. Phase 2 — verify the blend weights are intentional.

---

## BF-P1-007 — Replay TPS is Hardcoded Approximation, Not Measured

**Severity:** HIGH  
**Confidence:** CONFIRMED  
**Category:** Correctness  
**Status:** Open

**Evidence:**  
`services/telemetry-service/internal/aggregator/replay_worker.go:126`
```go
tps := count * 2 // simplified TPS derivation
```

**Impact:** Every bucket's displayed TPS in the Replay Engine is `requests_in_bucket × 2`. There is no actual time measurement. A bucket with 50 requests shows TPS=100 regardless of how long that bucket took. This makes replay TPS meaningless as a performance indicator.

**Recommended Action:** Calculate actual bucket duration from min/max `created_at` in bucket, then compute `count / duration_seconds`.

---

## BF-P1-008 — Replay Lifecycle Events Have Fabricated Timestamps

**Severity:** HIGH  
**Confidence:** CONFIRMED  
**Category:** Correctness / UI Fidelity  
**Status:** Open

**Evidence:**  
`services/telemetry-service/internal/aggregator/replay_worker.go:267-276`
```go
if bmData.StartedAt != "" {
    // Rough estimate for build/deploy since we don't have exact from benchmark metadata
    events = append(events, LifecycleEvent{Phase: "BUILD", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
    events = append(events, LifecycleEvent{Phase: "DEPLOY", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
    events = append(events, LifecycleEvent{Phase: "VALIDATION", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
    events = append(events, LifecycleEvent{Phase: "BENCHMARK", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
}
```

All four phases (BUILD, DEPLOY, VALIDATION, BENCHMARK) receive the identical `bmData.StartedAt` timestamp. These are acknowledged as "rough estimate" in a code comment. The Replay timeline is displaying fabricated data.

---

## BF-P1-009 — Mock Exchange Cannot Pass Tracer Scenarios

**Severity:** HIGH  
**Confidence:** CONFIRMED (from backend audit subagent)  
**Category:** Correctness / Testing  
**Status:** Open

**Evidence:**  
`services/mock-exchange/internal/` — The mock exchange sleeps `rand.Intn(20)` ms and returns `{"status":"accepted"}`.

The Tracer scenario expects:
- Step 1 BUY → response with `status: "resting"` and `order_id: <uuid>`
- Step 2 SELL → response with `status: "filled"`, `trades: [{maker_order_id: ..., price: 100.0, quantity: 10}]`

The mock exchange returns `{"status":"accepted"}` for all orders — this fails the Tracer's `CONTRACT_NOT_SUPPORTED` check immediately. Every benchmark against the mock exchange has 0% tracer correctness.

**Impact:** The "test against mock exchange" feature is non-functional for correctness validation. Only the sample Go engine in `sample-engines/` would pass.

---

## BF-P1-010 — Mock Exchange Has Compilation Errors (Cannot Build)

**Severity:** CRITICAL  
**Confidence:** CONFIRMED (from backend audit subagent)  
**Category:** Build / Deployment  
**Status:** Open

**Evidence:** `services/mock-exchange/cmd/server/main.go:11-13` contains stray imports outside the closing parenthesis of the import block — a Go syntax error that prevents compilation.

**Impact:** `docker compose up` will fail at the mock-exchange build step. The entire platform startup depends on mock-exchange being available.

**Note:** This was not caught by the local `go build` test because that test was run on bot-worker and benchmark-service, not mock-exchange.

---

## BF-P1-011 — Submission Service Has Compilation Errors

**Severity:** CRITICAL  
**Confidence:** CONFIRMED (from backend audit subagent)  
**Category:** Build / Deployment  
**Status:** Open

**Evidence:** `services/submission-service/internal/handlers/submissions.go:82-89` contains corrupted string literals:
```go
w.WriteHeader(submissionName, and language are required", http.StatusBadRequest)
w.WriteHeader(cpp, rust", http.StatusBadRequest)
```
These are syntax errors. The submission service cannot compile.

**Impact:** Users cannot upload submissions. The entire submission → build → deploy → benchmark pipeline is broken.

---

## BF-P1-012 — Telemetry Service Hardcodes Database Credentials

**Severity:** HIGH  
**Confidence:** CONFIRMED (from backend audit subagent)  
**Category:** Security / Configuration  
**Status:** Open

**Evidence:**  
`services/telemetry-service/internal/database/postgres.go:12`
```go
const defaultDSN = "postgres://postgres:password@postgres:5432/iicpc"
```
This hardcoded string is used regardless of the `DATABASE_URL` environment variable.

**Impact:** The telemetry service cannot connect to a differently-configured database. In production, this would prevent proper database credential rotation.

---

## BF-P1-013 — Container Runner Has No Row Locking on Submission Poll

**Severity:** HIGH  
**Confidence:** CONFIRMED (from backend audit subagent)  
**Category:** Reliability / Race Condition  
**Status:** Open

**Evidence:**  
`services/container-runner/internal/runner/runner.go:44-59` — `pollOnce()` queries `WHERE status='UPLOADED'` without `FOR UPDATE SKIP LOCKED`. Multiple poll ticks running concurrently could pick up the same submission and trigger duplicate `docker build` operations.

**Impact:** Same submission built twice; second build may fail with "image already exists"; resources wasted.

---

## BF-P1-014 — Deployment Service Has Port Allocation Race Condition

**Severity:** HIGH  
**Confidence:** CONFIRMED (from backend audit subagent)  
**Category:** Reliability / Race Condition  
**Status:** Open

**Evidence:** `services/deployment-service/internal/deployer/deployer.go` — Port scanning loop 30000-31000 without database row reservation. Concurrent deployment requests can allocate the same port.

**Impact:** Second container fails to start due to port already in use; deployment marked as failed incorrectly.

---

## BF-P1-015 — API Gateway Main Entry Point Is a Dead Placeholder

**Severity:** MEDIUM  
**Confidence:** CONFIRMED (from backend audit subagent)  
**Category:** Architecture  
**Status:** Open

**Evidence:** `services/api-gateway/main.go` (root file) is a dead placeholder printing "HAR HAR MAHADEV". The actual server starts from `cmd/server/main.go`. If the Dockerfile's `CMD` points to the wrong entry point, the gateway does not start.

**Recommended Action:** Remove root `main.go` to prevent confusion. Verify Dockerfile CMD points to `cmd/server/`.

---

## BF-P1-016 — Compiled Binary Committed to Git (benchmark-service)

**Severity:** MEDIUM  
**Confidence:** CONFIRMED  
**Category:** Repository Hygiene  
**Status:** Open

**Evidence:** `services/benchmark-service/benchmark-service` — a 12.7MB ELF binary is committed to the repository. This is likely a Linux build artifact.

**Impact:** Inflates repository size; may cause confusion about which binary is deployed; .gitignore should exclude binaries.

---

## BF-P1-017 — Frontend: Extensive Mock Data in Admin Dashboards

**Severity:** HIGH  
**Confidence:** CONFIRMED (from frontend audit subagent)  
**Category:** Frontend / Data Fidelity  
**Status:** Open

**Evidence (file:line citations from frontend subagent):**
- `src/pages/admin/deployments/ActiveSubmissionDeployments.tsx:3-8` — static mock deployment array
- `src/pages/admin/queue/QueueControlCenter.tsx:3-9` — static mock job queue
- `src/pages/admin/queue/QueueKPICards.tsx:5-10` — hardcoded KPI values ("4,102", "850/s")
- `src/pages/PostgresMonitoringPage.tsx:9-17` — hardcoded chart data
- `src/pages/RedisMonitoringPage.tsx:9-17` — hardcoded chart data
- `src/pages/admin/dashboard/JudgeDemoPanel.tsx:43-57` — `setInterval` faking benchmark progress

**Impact:** Admin dashboards presenting as live system state are showing hardcoded values. The observability claims in the README for the admin panel are substantially misleading.

---

## BF-P1-018 — Frontend: Multiple API Endpoints Called Don't Exist in Backend

**Severity:** HIGH  
**Confidence:** CONFIRMED (from frontend audit subagent)  
**Category:** Frontend / API Contract  
**Status:** Open

**Evidence:**
- `GET /logs` — called by `logsService.fetchLogs` but no backend service implements this route
- `GET /notifications` — called by `notificationsService.fetchNotifications` but not implemented
- `POST /infrastructure/stress-test` — defined in frontend, not in backend
- `POST /deployments/:id/rollback` — defined in frontend, not in backend

**Impact:** These features are silently broken — API calls return 404, caught, and return empty arrays. Users see empty/broken pages.

---

## BF-P1-019 — Tracer Count = 0 → Default Concurrency Score = 100

**Severity:** MEDIUM  
**Confidence:** CONFIRMED  
**Category:** Scoring Integrity  
**Status:** Open

**Evidence:**  
`services/benchmark-service/internal/repository/leaderboard.go:118`
```go
concurrencyScore := 100.0 // Default to 100 if no tracers ran
if tracerTotal.Valid && tracerTotal.Int64 > 0 {
    concurrencyScore = (float64(tracerSuccess.Int64) / float64(tracerTotal.Int64)) * 100.0
}
```

A benchmark with 0 tracer invocations (statistically possible with small `totalRequests`) receives perfect concurrency score by default, inflating the final score.

**Phase 2 Question:** What is the statistical probability of zero tracers given default 1000 requests and 5% probability?

---

## BF-P1-020 — No CI/CD Pipeline Configured

**Severity:** MEDIUM  
**Confidence:** CONFIRMED  
**Category:** Engineering Practice  
**Status:** Open

**Evidence:** `.github/` contains only `ISSUE_TEMPLATE/` and `pull_request_template.md`. No GitHub Actions workflows exist. No automated builds, tests, or linting run on commit.

**Impact:** Compilation errors in mock-exchange and submission-service were not caught before commit.

---

## BF-P1-021 — Scripts Directory Is Empty

**Severity:** LOW  
**Confidence:** CONFIRMED  
**Category:** Repository Structure  
**Status:** Open

**Evidence:** `scripts/` directory is empty. README references "DB migration tools, CI/CD helpers, and local dev bootstrapping scripts."

**Impact:** New contributors have no automated way to initialize the database. Migrations are run per-service at startup, but no unified initialization script exists.

---

## Summary Table

| ID | Severity | Category | Status |
|---|---|---|---|
| BF-P1-001 | 🔴 CRITICAL | Correctness | Open |
| BF-P1-002 | 🔴 CRITICAL | Security | Open |
| BF-P1-010 | 🔴 CRITICAL | Build | Open |
| BF-P1-011 | 🔴 CRITICAL | Build | Open |
| BF-P1-003 | 🟠 HIGH | Reliability | Open |
| BF-P1-004 | 🟠 HIGH | Security | Open |
| BF-P1-005 | 🟠 HIGH | Security | Open |
| BF-P1-006 | 🟠 HIGH | Correctness | Open |
| BF-P1-007 | 🟠 HIGH | Correctness | Open |
| BF-P1-008 | 🟠 HIGH | UI Fidelity | Open |
| BF-P1-009 | 🟠 HIGH | Correctness | Open |
| BF-P1-012 | 🟠 HIGH | Security | Open |
| BF-P1-013 | 🟠 HIGH | Reliability | Open |
| BF-P1-014 | 🟠 HIGH | Reliability | Open |
| BF-P1-017 | 🟠 HIGH | Frontend | Open |
| BF-P1-018 | 🟠 HIGH | Frontend | Open |
| BF-P1-015 | 🟡 MEDIUM | Architecture | Open |
| BF-P1-016 | 🟡 MEDIUM | Hygiene | Open |
| BF-P1-019 | 🟡 MEDIUM | Scoring | Open |
| BF-P1-020 | 🟡 MEDIUM | Engineering | Open |
| BF-P1-021 | 🟢 LOW | Structure | Open |
