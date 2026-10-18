# BenchForge Phase 1 Audit — Additional Critical Findings

**Additional findings from subagent deep inspection of services and deployment.**

---

## NEW FINDINGS — Added After Subagent Investigation

---

## BF-P1-022 — ALL 9 Dockerfiles Reference Non-Existent Go 1.26

**Severity:** CRITICAL  
**Confidence:** CONFIRMED  
**Category:** Build / Deployment  
**Status:** Open

**Evidence:** Every Dockerfile in `services/*/Dockerfile` uses `FROM golang:1.26-alpine AS builder`. Go 1.26 does not exist on Docker Hub (latest stable is 1.22.x at time of audit). Running `docker compose build` fails on every service.

**Impact:** The entire platform CANNOT be deployed via Docker Compose. All 9 container builds fail at the FROM line.

**Recommended Action:** Change to `FROM golang:1.22-alpine AS builder` (or current stable version).

---

## BF-P1-023 — No Migration Runner — Database Tables Never Created

**Severity:** CRITICAL  
**Confidence:** CONFIRMED  
**Category:** Database / Deployment  
**Status:** Open

**Evidence:** 33 SQL migration files exist across 5 service directories. However, there is NO migration runner, no `golang-migrate` setup, no init SQL in docker-compose.yml volumes, and no script in the empty `scripts/` directory. 

The only table created automatically is `auth_users` (defined in Go code in api-gateway). All other tables (`submissions`, `deployments`, `benchmarks`, `telemetry_metrics`, `leaderboard_entries`, etc.) are never initialized on a fresh database.

**Impact:** On first `docker compose up`, every service that queries its tables will crash with "relation does not exist."

**Recommended Action:** Add a migration init container in docker-compose.yml OR use `golang-migrate` at service startup OR add an init SQL script mounted to PostgreSQL.

---

## BF-P1-024 — Contestant Containers Join Internal Network — Can Reach Redis and Postgres

**Severity:** CRITICAL  
**Confidence:** CONFIRMED  
**Category:** Security  
**Status:** Open

**Evidence:** `services/deployment-service/internal/deployer/deployer.go:L17-25`
```bash
docker run -d -p <hostPort>:<containerPort> --name <name> \
  --network iicpc_benchforge_default <image>
```

Contestant containers are placed on `iicpc_benchforge_default` — the same Docker network as Redis (6379) and PostgreSQL (5432). Untrusted contestant code can:
- Query the leaderboard database directly
- Manipulate the Redis telemetry stream (inject fake metrics)
- Read other teams' telemetry data

**Recommended Action:** Create an isolated network for contestant containers. Never put untrusted code on the same network as infrastructure.

---

## BF-P1-025 — Actual .env File with Secrets Is Tracked in Git

**Severity:** CRITICAL  
**Confidence:** CONFIRMED  
**Category:** Security  
**Status:** Open

**Evidence:** `services/bot-worker/.env` is tracked in git, containing `WORKER_SECRET=super_secret_worker_key_12345`. This secret is different from the `.env.example` value, suggesting this is an actual production/development credential committed to the repository.

**Impact:** `WORKER_SECRET` is used to sign worker JWTs that authorize metric ingestion. Anyone with access to this secret can inject arbitrary metrics into any benchmark.

**Recommended Action:** Immediately rotate the WORKER_SECRET. Add `*.env` (non-example files) to `.gitignore`. Remove from git history with `git filter-repo`.

---

## BF-P1-026 — Dockerfile EXPOSE Ports Don't Match Actual Service Ports

**Severity:** HIGH  
**Confidence:** CONFIRMED  
**Category:** Deployment  
**Status:** Open

**Evidence:**
- `benchmark-service/Dockerfile` EXPOSE 8080, but service listens on 8082
- `bot-worker/Dockerfile` EXPOSE 8080, but service listens on 8085
- `container-runner/Dockerfile` EXPOSE 8090, but service has no HTTP port

**Impact:** While Docker Compose port mappings override EXPOSE, this creates confusion and breaks any orchestration that relies on EXPOSE declarations.

---

## BF-P1-027 — Telemetry Consumer Inserts One Row Per Message (No Batching)

**Severity:** HIGH  
**Confidence:** CONFIRMED  
**Category:** Performance  
**Status:** Open

**Evidence:** `consumer.go:136-154` — Despite reading 100 messages per batch from Redis, each message is processed sequentially with a single `db.Exec` call. Under high load (claimed 10,000-20,000 TPS), this creates 10,000-20,000 round-trips per second to the database.

**Impact:** Database saturation under load. The README claim of "~15,000 metrics/sec ingestion" is unsubstantiated and likely incorrect given single-row inserts.

**Recommended Action:** Batch insert using `COPY` or multi-row `INSERT VALUES ($1,$2..),($3,$4..)`.

---

## BF-P1-028 — Prometheus Scrapes Zero Microservices

**Severity:** HIGH  
**Confidence:** CONFIRMED  
**Category:** Observability  
**Status:** Open

**Evidence:** `deployments/prometheus/prometheus.yml` — scrape_configs targets only:
- `mock-exchange:9000`
- `cadvisor:8080`
- `redis-exporter:9121`
- `postgres-exporter:9187`

None of the 7 core microservices (api-gateway, benchmark-service, bot-worker, telemetry-service, etc.) are scraped.

**Impact:** The Prometheus dashboards show only infrastructure metrics. All "custom" service metrics (TPS, latency, error rates per service) are NOT in Prometheus. The "full observability stack" claim is significantly overstated.

---

## BF-P1-029 — Grafana Has No Mounted Dashboards

**Severity:** HIGH  
**Confidence:** CONFIRMED  
**Category:** Observability  
**Status:** Open

**Evidence:** Grafana in `docker-compose.yml` has NO volume mounts. `observability/dashboards/benchforge.json` exists but is never provisioned. Grafana starts as a completely blank instance.

**Impact:** The "Pre-configured Grafana dashboards" claim is false. Grafana shows no dashboards by default.

---

## BF-P1-030 — Alert Rules Are Unmounted and Non-Functional

**Severity:** MEDIUM  
**Confidence:** CONFIRMED  
**Category:** Observability  
**Status:** Open

**Evidence:** `observability/alerts/prometheus_rules.yml` contains alert rules (`HighErrorRate`, `RedisReclaimedMessagesSpike`, `BenchmarkLatencyHigh`) but `prometheus.yml` has no `rule_files` directive and the file is not mounted to Prometheus in docker-compose.yml.

---

## BF-P1-031 — `kubernetes/` and `docker/` Directories Under deployments/ Are Empty

**Severity:** MEDIUM  
**Confidence:** CONFIRMED  
**Category:** Documentation / Claims  
**Status:** Open

**Evidence:** `deployments/kubernetes/` and `deployments/docker/` are completely empty directories. README and the 6-month roadmap reference Kubernetes manifests and Helm charts as existing. They do not.

---

## BF-P1-032 — `submissions` Table Written by 5 Different Services

**Severity:** HIGH  
**Confidence:** CONFIRMED  
**Category:** Architecture  
**Status:** Open

**Evidence:**
- `submission-service` — owns the table via migrations
- `container-runner` — writes `current_stage`, `stage_status`, `container_image`, `status`
- `deployment-service` — writes `current_stage`, `stage_status`  
- `benchmark-service` — writes `correctness_score`, `correctness_details`, `current_stage`
- `leaderboard-service` — reads via JOINs in scoring queries

**Impact:** This is a distributed database anti-pattern. Multiple services modifying the same table rows creates race conditions and makes data ownership unclear. This contradicts microservices principles.

---

## BF-P1-033 — `deployment_service` Default Bot Worker URL Points to Wrong Port

**Severity:** MEDIUM  
**Confidence:** CONFIRMED  
**Category:** Configuration  
**Status:** Open

**Evidence:** `services/bot-worker/internal/config/config.go:43` — `EXCHANGE_URL` defaults to `http://mock-exchange:8080`. Mock exchange runs on port `9000`. If `EXCHANGE_URL` is not set in the environment, all benchmarks against mock exchange fail to reach the engine.

---

## Updated Critical Findings Summary

Including all findings from all workstreams:

| ID | Severity | Description |
|---|---|---|
| BF-P1-022 | 🔴 CRITICAL | All Dockerfiles reference non-existent Go 1.26 — platform cannot be deployed |
| BF-P1-023 | 🔴 CRITICAL | No migration runner — all tables missing on fresh install |
| BF-P1-024 | 🔴 CRITICAL | Contestant containers on internal network — can reach Redis and Postgres |
| BF-P1-025 | 🔴 CRITICAL | `.env` file with real secret committed to git |
| BF-P1-001 | 🔴 CRITICAL | checkCorrectnessStub — non-tracer correctness not validated |
| BF-P1-002 | 🔴 CRITICAL | Zip path traversal vulnerability |
| BF-P1-010 | 🔴 CRITICAL | mock-exchange compilation error |
| BF-P1-011 | 🔴 CRITICAL | submission-service compilation error |
