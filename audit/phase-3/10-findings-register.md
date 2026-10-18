# BenchForge Phase 3 — Findings Register

**Audit Date:** 2026-10-17  
**Scope:** Distributed Systems, Security, Concurrency, and Failure-Recovery  
**Auditor:** Independent Systems & Security Auditor (Phase 3)

---

## 1. Summary Findings Register

| ID | Title | Severity | Status | Affected Component | File / Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BF-P3-001** | `X-Forwarded-For` Rate-Limiter Spoofing & DoS Bypass | **Critical** | **Verified** | API Gateway | `api-gateway/internal/middleware/ratelimit.go:37-45` |
| **BF-P3-002** | IDOR on Submissions & Live Validation Streams | **Critical** | **Verified** | Submission Service | `submission-service/internal/handlers/submissions.go:52-85` |
| **BF-P3-003** | Queue Starvation on Manual Benchmark Cancellation | **High** | **Verified** | Benchmark Service | `benchmark-service/internal/handlers/benchmarks.go:142-160` |
| **BF-P3-004** | Host Escape via Docker Socket & Zip-Slip Path Traversal | **Critical** | **Verified** | Container Runner | `container-runner/internal/runner/unzip.go:37-42` & `docker-compose.yml` |
| **BF-P3-005** | Unauthenticated Internal Ports Bound to `0.0.0.0` | **Critical** | **Verified** | Deployment Manifest | `docker-compose.yml:25-95` |
| **BF-P3-006** | Fatal Map Panic Risk under `RLock()` in WebSocket Hub | **High** | **Verified** | Telemetry Service | `telemetry-service/internal/websocket/hub.go:55-73` |
| **BF-P3-007** | Bot-Worker Memory Spike & Channel Buffer Explosion | **High** | **Verified** | Bot Worker | `bot-worker/internal/worker/runner.go:48-52` |
| **BF-P3-008** | Telemetry Drainage Race Window in Benchmark Finalization | **High** | **Verified** | Bot Worker / Telemetry | `bot-worker/internal/worker/runner.go:88-95` |
| **BF-P3-009** | Ephemeral Port Allocation TOCTOU Race Condition | **Medium** | **Verified** | Container Runner | `container-runner/internal/runner/deployer.go:35-48` |
| **BF-P3-010** | Multi-Service Write Collisions on `submissions` Table | **Medium** | **Verified** | Shared PostgreSQL | Multiple Services / SQL Repositories |

---

## 2. Detailed Findings Register

### BF-P3-001: Rate Limiting Bypass via `X-Forwarded-For` Spoofing
- **Severity:** Critical (CVSS 8.6)
- **Status:** Verified
- **Affected File:** `services/api-gateway/internal/middleware/ratelimit.go:37-45`
- **Description:** `getClientIP()` parses the first element of `X-Forwarded-For` unconditionally (`strings.Split(forwarded, ",")[0]`) without verifying whether `r.RemoteAddr` is a trusted proxy.
- **Impact:** An attacker can bypass all rate limits on `/auth/login`, `/auth/register`, and `/leaderboard` by rotating arbitrary IP strings in the header, enabling credential stuffing, user flood DoS, and data scraping.
- **Reproduction:** Verified in `audit/phase-3/tests/auth_security_test.go:TestRateLimiterXForwardedForSpoofing`.
- **Remediation:** Disallow client-provided `X-Forwarded-For` headers unless the direct peer connection originates from a configured CIDR of trusted reverse proxies.

---

### BF-P3-002: Insecure Direct Object Reference (IDOR) on Submissions & Streams
- **Severity:** Critical (CVSS 8.8)
- **Status:** Verified
- **Affected File:** `services/submission-service/internal/handlers/submissions.go:52-85`
- **Description:** `GetSubmissionByID` and `StreamLogs` do not verify whether the requesting team (`X-Team-Id`) owns the submission record.
- **Impact:** Any authenticated user can read competitor submission metadata, Docker image tags, build logs, and stream live execution output during evaluation.
- **Reproduction:** Verified in `audit/phase-3/tests/auth_security_test.go:TestIDORSubmissionAccessGaps`.
- **Remediation:** Enforce ownership authorization: `if submission.TeamID != c.GetHeader("X-Team-Id") && c.GetHeader("X-User-Role") != "ADMIN" { c.AbortWithStatus(403) }`.

---

### BF-P3-003: Queue Starvation on Manual Benchmark Cancellation
- **Severity:** High
- **Status:** Verified
- **Affected File:** `services/benchmark-service/internal/handlers/benchmarks.go:142-160`
- **Description:** `StopBenchmark` updates status to `CANCELLED` but fails to invoke `go h.ProcessQueue()`.
- **Impact:** With `MAX_CONCURRENT_BENCHMARKS = 1`, cancelling a running benchmark frees the slot in the database, but no goroutine wakes up to process the next queued benchmark. All waiting benchmarks starve until a new benchmark is created or the service is restarted.
- **Reproduction:** Verified in `audit/phase-3/tests/failure_recovery_test.go:TestManualCancellationQueueStarvation`.
- **Remediation:** Add `go h.ProcessQueue()` immediately after the status update query.

---

### BF-P3-004: Host Escape via Docker Socket & Zip-Slip Path Traversal
- **Severity:** Critical (CVSS 9.8)
- **Status:** Verified
- **Affected Files:** `services/container-runner/internal/runner/unzip.go:37-42`, `docker-compose.yml:85-92`
- **Description:** `unzip.go` joins paths using `filepath.Join(dest, f.Name)` without prefix verification, allowing directory traversal. Furthermore, `container-runner` runs as `root` with `/var/run/docker.sock` mounted.
- **Impact:** A submitted archive can write files outside the destination directory, and anyone controlling container deployment commands can mount the host filesystem (`-v /:/host`) and execute arbitrary code as root on the host server.
- **Reproduction:** Verified in `audit/phase-3/tests/container_isolation_test.go:TestZipSlipVulnerabilityPoC` & `TestDockerSocketThreatModel`.
- **Remediation:** Add strict canonical path prefix verification to `Unzip()` and replace Docker socket mounting with an isolated virtualization layer (gVisor or Firecracker).

---

### BF-P3-005: Unauthenticated Internal Ports Bound to `0.0.0.0`
- **Severity:** Critical (CVSS 9.8)
- **Status:** Verified
- **Affected File:** `docker-compose.yml:25-95`
- **Description:** Ports 8081, 8082, 8083, 8084, 8085, and 8091 are exposed on all interfaces without authentication middleware.
- **Impact:** An attacker on the local network or cloud VPC can bypass the API Gateway entirely and invoke internal service endpoints directly (e.g. `POST :8091/deploy` or `POST :8082/submissions`).
- **Remediation:** Remove public port bindings for internal services in `docker-compose.yml` and communicate strictly over Docker internal network aliases.

---

### BF-P3-006: Fatal Map Panic Risk Under `RLock()` in WebSocket Hub
- **Severity:** High
- **Status:** Verified
- **Affected File:** `services/telemetry-service/internal/websocket/hub.go:55-73`
- **Description:** In the `Run()` loop, `delete(room, client)` is called while holding only `h.mu.RLock()`.
- **Impact:** Concurrent readers and unregister events trigger `fatal error: concurrent map read and map write`, crashing `telemetry-service` and dropping all active WebSocket connections.
- **Reproduction:** Verified in `audit/phase-3/tests/concurrency_test.go:TestHubConcurrentMapReadWrite`.
- **Remediation:** Upgrade `h.mu.RLock()` to an exclusive `h.mu.Lock()` for the unregister event branch.

---

### BF-P3-007: Bot-Worker Memory Spike & Channel Buffer Explosion
- **Severity:** High
- **Status:** Verified
- **Affected File:** `services/bot-worker/internal/worker/runner.go:48-52`
- **Description:** Allocates `make(chan WorkloadJob, workload.TotalRequests)` and `make(chan JobResult, workload.TotalRequests)` without a maximum ceiling.
- **Impact:** Workloads with large request counts (e.g. 5,000,000 orders) cause instant multi-gigabyte memory allocations, triggering kernel OOM killer terminations.
- **Reproduction:** Verified in `audit/phase-3/tests/concurrency_test.go:TestChannelMemoryAllocation`.
- **Remediation:** Cap channel buffers to a maximum of 10,000 items and stream jobs into the channel from a producer goroutine.

---

### BF-P3-008: Telemetry Drainage Race Window in Benchmark Finalization
- **Severity:** High
- **Status:** Verified
- **Affected Files:** `services/bot-worker/internal/worker/runner.go:88-95`, `services/benchmark-service/internal/handlers/benchmarks.go:210-230`
- **Description:** `bot-worker` signals `COMPLETED` immediately upon sending the last order, causing `benchmark-service` to compute metrics from PostgreSQL while Redis Streams still has thousands of uningested records in the queue.
- **Impact:** Benchmark metrics (P99 latency, throughput, score) are calculated against a truncated subset of data, invalidating benchmark rankings.
- **Reproduction:** Verified in `audit/phase-3/tests/redis_streams_test.go:TestTelemetryDrainageRaceWindow`.
- **Remediation:** Introduce a stream completion sentinel event and require `telemetry-service` to confirm stream drainage before final aggregation begins.

---

### BF-P3-009: Ephemeral Port Allocation TOCTOU Race Condition
- **Severity:** Medium
- **Status:** Verified
- **Affected File:** `services/container-runner/internal/runner/deployer.go:35-48`
- **Description:** `AllocatePort` binds to a port and closes it immediately. Concurrent runner instances can probe and return the same port before either container starts.
- **Impact:** Container deployment fails with `bind: address already in use`.
- **Reproduction:** Verified in `audit/phase-3/tests/database_consistency_test.go:TestPortAllocationRace`.
- **Remediation:** Allocate ports using an atomic PostgreSQL reservation table.

---

### BF-P3-010: Multi-Service Write Collisions on `submissions` Table
- **Severity:** Medium
- **Status:** Verified
- **Affected File:** Shared database across all services
- **Description:** Four microservices update the `submissions` table directly without optimistic concurrency control (`version` check).
- **Impact:** Stale updates can overwrite terminal states (e.g. `TIMED_OUT` overwritten back to `FAILED` or build logs clobbered).
- **Reproduction:** Verified in `audit/phase-3/tests/database_consistency_test.go:TestMultiServiceSubmissionWriteCollision`.
- **Remediation:** Add a `version INT` column and enforce `WHERE id = $1 AND version = $2` on all status transitions.
