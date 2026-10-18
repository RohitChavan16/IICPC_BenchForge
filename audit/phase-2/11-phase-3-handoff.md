# BenchForge Phase 2 Audit — Phase 3 Handoff Specification

**High-Priority Focus Areas for Phase 3: Concurrency, Contention, Security, and Scalability**

---

## 1. High-Priority Questions for Phase 3 Investigation

Based on the confirmed findings from Phase 1 and Phase 2, the following technical domains require targeted forensic investigation in Phase 3:

---

### Area 1: Race Conditions & Concurrent Data Mutation

1. **Multi-Service Writers on `submissions` Table (BF-P1-032):**
   - *Investigation Focus:* `container-runner`, `deployment-service`, and `benchmark-service` all issue concurrent `UPDATE submissions` queries. Can asynchronous message re-ordering cause pipeline stage regression (e.g., from `BENCHMARK` back to `DEPLOYMENT`)?
   - *Phase 3 Task:* Write a concurrent stress harness issuing overlapping stage updates to verify if PostgreSQL transaction isolation or application logic prevents out-of-order stage writes.

2. **Container Runner Polling Race Condition (BF-P1-013):**
   - *Investigation Focus:* `runner.go:44` polls `status='UPLOADED'` without `FOR UPDATE SKIP LOCKED`. If two runner processes or overlapping ticker loops run, does the system build duplicate Docker images and exhaust host disk space?
   - *Phase 3 Task:* Test overlapping poll loops under high submission submission velocity.

3. **Port Allocation Race Condition (BF-P1-014):**
   - *Investigation Focus:* `deployer.go:AllocatePort` scans 30000–31000 without reserving the port row in an atomic transaction.
   - *Phase 3 Task:* Test concurrent `POST /deployments` calls to verify if two containers are allocated the same port, leading to Docker container startup failures.

---

### Area 2: Ingestion Scalability & Database Contention

1. **Unbatched Telemetry Ingestion (BF-P1-027):**
   - *Investigation Focus:* `consumer.go` reads 100 messages from Redis Streams per batch, but executes sequential, unbatched `INSERT` statements into PostgreSQL.
   - *Phase 3 Task:* Measure maximum sustainable telemetry ingestion throughput on a real PostgreSQL instance. Determine at what TPS threshold the consumer lags and builds unbounded consumer group lag in Redis.

2. **Telemetry Ingestion vs Leaderboard Upsert Race Window:**
   - *Investigation Focus:* `bot-worker` calls `PATCH /benchmarks/:id (COMPLETED)` immediately upon completing its job loop, triggering `UpsertLeaderboardEntryFromBenchmark`. Concurrently, it sends `STOP_STREAM` to Redis.
   - *Phase 3 Task:* Verify whether `GenerateReplay()` triggers before Redis Streams has fully drained, resulting in truncated replay buckets.

---

### Area 3: Container Security & Host Isolation

1. **Docker Socket Mount & Host Escape Vector (BF-P1-004):**
   - *Investigation Focus:* Both `container-runner` and `deployment-service` mount `/var/run/docker.sock`.
   - *Phase 3 Task:* Audit the exact permissions and potential breakout pathways. If contestant code escapes its container, can it access the mounted socket and execute arbitrary commands as `root` on the host?

2. **Missing Cgroups Limits on Contestant Containers (BF-P1-005):**
   - *Investigation Focus:* Contestant containers are executed via `docker run` without `--memory`, `--cpus`, or `--pids-limit`.
   - *Phase 3 Task:* Execute adversarial submissions implementing fork bombs, unbounded memory allocations, and infinite CPU loops to determine if untrusted code can crash the host benchmarking daemon.

3. **Shared Network Exposure (BF-P1-024):**
   - *Investigation Focus:* Contestant containers join `iicpc_benchforge_default`, exposing Redis (6379) and PostgreSQL (5432).
   - *Phase 3 Task:* Test whether a contestant container can establish direct TCP connections to Redis or Postgres and manipulate the leaderboard or inject fake metrics.

---

### Area 4: High-Concurrency Client Transport & Saturation

1. **Connection Pool Bounds & Coordinated Omission:**
   - *Investigation Focus:* `MaxConnsPerHost` is set to `workerCount * 2`. When a target engine locks up, worker goroutines block on HTTP responses.
   - *Phase 3 Task:* Determine whether load generator saturation masks latency spikes during prolonged engine stalls, and evaluate whether open-loop load generation (e.g., constant rate arrival) should replace closed-loop concurrency.

2. **Tracer Concurrency Under High Load:**
   - *Investigation Focus:* Tracer scenarios generate symbols with `uuid.NewString()[:8]`.
   - *Phase 3 Task:* At 20,000 TPS, evaluate whether 8-character UUID prefixes risk symbol collisions across concurrent tracer executions.

---

## 2. Phase 3 Prerequisite Worklist

Before commencing Phase 3 execution, the following infrastructure blockers must be addressed:

| Item | Prerequisite Action | Phase 1 / 2 Finding Reference |
|---|---|---|
| **1. Fix Dockerfiles** | Change `golang:1.26-alpine` to current stable Go (`golang:1.22-alpine` or `golang:1.23-alpine`) across all 9 Dockerfiles. | BF-P1-022 |
| **2. Fix Compilation Errors** | Fix stray import syntax error in `services/mock-exchange/cmd/server/main.go` and corrupted string literals in `services/submission-service/internal/handlers/submissions.go`. | BF-P1-010, BF-P1-011 |
| **3. Database Migration Runner** | Add an automated migration bootstrapping container or script to initialize all 33 migration files across PostgreSQL tables on startup. | BF-P1-023 |
| **4. Patch Critical Gaming Loopholes** | Remove `computedSuccessRate` fallback in `leaderboard.go:112` and implement response validation in `pool.go:checkCorrectnessStub`. | BF-P2-001 |
| **5. Standardize Latency Units** | Unify latency representations across `bot-worker`, `telemetry-service`, and `replay_worker` to milliseconds. | BF-P2-003 |
