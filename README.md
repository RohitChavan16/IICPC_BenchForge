# ⚡ BenchForge

> A production-grade, distributed benchmarking and telemetry infrastructure platform designed for high-concurrency performance testing, real-time observability, and scalable systems experimentation.

**Team:** VakraNode  
**Single Team Member:** Rohit Chavan  
**Institution:** COEP Technological University, Pune  

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8.svg)](https://golang.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg)](https://www.docker.com/)
[![State: Production-Ready](https://img.shields.io/badge/State-Production_Ready-4CAF50.svg)]()

---

## 01 | Executive Summary & Vision

**BenchForge** is a cutting-edge distributed load generation and telemetry pipeline built to objectively benchmark trading engine architectures under realistic market conditions. It containerizes contestant submissions, generates high-concurrency load using stateful trading personas, streams telemetry through an event-driven pipeline, and ranks teams in real time — entirely automated, entirely quantitative.

### Why It Was Built
Hackathons typically grade demos, not systems. BenchForge exists to grade deployed microservices under 10,000+ TPS of realistic trading traffic — proving production readiness, not just presentation polish.

### What Makes It Different
Unlike standard HTTP pingers like `wrk` or `jmeter`, BenchForge operates with true domain awareness. It features six stateful trading personas, an at-least-once Redis Streams telemetry pipeline, a 20-bucket Replay Engine with automatic anomaly detection, and a strict correctness-enforcing Tracer persona. 

### Key Engineering Achievements (Solo Execution)
Every component of this massive distributed system was designed and built by a single engineer (Rohit Chavan, 2nd-year ECE student).
*   **7 Go Microservices**
*   **Redis Streams Pipeline**
*   **100 Goroutine Workers**
*   **6 Trading Personas**
*   **Tracer Correctness Validator**
*   **20-Bucket Replay Engine**
*   **Auto Anomaly Detection**
*   **Live WebSocket Leaderboard**
*   **Prometheus + Grafana Stack**
*   **Docker Container Isolation**
*   **PostgreSQL Window Functions**
*   **Graceful Shutdown (all services)**

---

## 02 | Problem Statement & The Gap BenchForge Fills

Existing evaluation platforms share a critical blind spot: they test algorithmic correctness on a single thread, then declare a winner. None of them measure whether a system survives real-world concurrency — the defining challenge of production software engineering.

### Platform Comparison

| Platform | Tests Correctness | Tests Throughput | Tests Latency | Tests Concurrency | Tests Observability |
|---|---|---|---|---|---|
| **LeetCode / HackerRank** | ✓ Single-threaded | ✗ | ✗ | ✗ | ✗ |
| **Kaggle** | ✓ ML accuracy | ✗ | ✗ | ✗ | ✗ |
| **Traditional Hackathons**| ✓ Manual review | ✗ | ✗ | ✗ | ✗ |
| **JMeter / Vegeta** | ✗ No validation | Blind HTTP only | Basic avg only | ✓ Limited | ✗ |
| **BenchForge** | **✓ Tracer persona** | **✓ Up to 20K TPS** | **✓ P50/P90/P99** | **✓ 100 goroutines** | **✓ Full stack** |

### The Gap BenchForge Fills
1.  **Correctness Is Not Enough:** A system returning `200 OK` for 10 sequential requests may crash under 10,000 concurrent ones. TPS without correctness is meaningless — correctness without TPS is insufficient.
2.  **Tail Latency Matters Most:** Average latency hides the real story. A P99 of 500ms means 1% of users wait half a second — in trading, that 1% includes the moment of maximum load.
3.  **Observability Is First-Class:** Knowing a system failed is not enough. BenchForge tells you exactly which persona caused the failure, at which bucket in the timeline, and what the P99 looked like 5 seconds before.

---

## 03 | Trading System Relevance

Trading systems are the most demanding class of concurrent software in production. Every design decision in BenchForge was engineered to simulate the specific failure modes of real financial exchanges.

| Trading Property | Real-World Requirement | How BenchForge Tests It |
|---|---|---|
| **Order Throughput** | Thousands of orders/second without queue buildup. | Bot Workers generate 10K–20K concurrent HTTP requests. |
| **Tail Latency (P99)** | P99 < 10ms; GC pauses cause cascading failures. | P99 measured per bucket; directly penalized in scoring formula. |
| **Concurrency Safety** | Race conditions corrupt the order book. | 100 goroutines simultaneously target the matching engine. |
| **Deep Book Traversal**| Whale orders must match against hundreds of resting orders. | Whale persona (1000–5000 qty) stresses loop efficiency & memory. |
| **Functional Correctness**| Matched trades must produce exact receipts. | Tracer persona validates BUY→resting, SELL→filled with exact receipt. |
| **Failure Recovery** | System must survive OOMKill and restart cleanly. | Watchdog detects crashes; benchmark marked ABORTED with replay data. |
| **Market Surges** | Sudden burst of aggressive orders. | Scalper + HFT Stressor personas cause deterministic traffic spikes. |

> [!IMPORTANT]
> **Why P99 Matters in Trading:** A system with P50=2ms and P99=800ms is catastrophically broken. One in every 100 requests spends 800ms waiting. BenchForge's scoring formula explicitly damps scores for high P99 values using the formula: `250 / (250 + P99_ms)`.

---

## 04 | Engineering Challenges & Solutions

Five core engineering problems required novel solutions. Each represents a deliberate architectural decision with measurable impact on platform reliability and throughput.

| Challenge | Problem | Solution | Result |
|---|---|---|---|
| **Load Generation Bottleneck** | 100 goroutines writing directly to Postgres saturate the connection pool and block load generation. | Redis Streams as fire-and-forget buffer: Workers call `XADD` and never wait. Telemetry Service consumes in batches asynchronously. | Peak TPS achieved with zero I/O backpressure. DB writes batched 100×. |
| **Correctness Validation** | Teams could fake an HTTP `200 OK` without running a real matching engine, inflating TPS scores. | Tracer Persona (5% override): sequential BUY→assert resting, SELL→assert filled with exact receipt. Correctness% is squared in scoring formula. | Cheating is architecturally impossible. 90% correctness → 81% score multiplier. |
| **Replay Without Raw Scan** | Iterating millions of raw telemetry rows in Go memory would cause OOM and multi-minute delays. | Postgres Window Functions (`PERCENTILE_CONT` + cumulative `COUNT(*) OVER`) aggregate directly in DB into 20 normalized buckets. Zero Go-side iteration. | Replay generation is near-instantaneous regardless of telemetry volume. |
| **Real-Time Analytics at Scale** | Polling Postgres for live telemetry every second under concurrent load causes query storms. | In-memory aggregators (Global, Per-Worker, Per-Persona) updated as Redis messages arrive. 1Hz ticker snapshots and broadcasts via WebSocket. | 1Hz live updates to all clients with zero database reads on the hot path. |
| **Leaderboard Consistency** | Concurrent benchmark completions could overwrite a team's best score via race condition. | Postgres `ON CONFLICT` upsert with conditional: `WHERE EXCLUDED.final_score > leaderboard_entries.final_score`. Atomic, lock-free preservation. | Leaderboard always reflects each team's global best. No race conditions. |

---

## 05 | High-Level Architecture & Microservices

BenchForge is organized into three operational planes. Strict plane separation ensures load generation, data persistence, and observability never contend for the same resources.

*   **Control Plane:** API Gateway, Submission Service, Deployment Service, Benchmark Service, Container Runner.
*   **Data Plane:** Bot Worker, Redis Streams, Telemetry Service, PostgreSQL, Leaderboard Service.
*   **Observability Plane:** Prometheus, Grafana, cAdvisor, Redis Exporter, Postgres Exporter.

### Microservices Breakdown

| Service | Port | Responsibility | Communicates With | Scaling Strategy |
|---|---|---|---|---|
| **API Gateway** | 8080 | JWT auth, RBAC, reverse proxy | All services (HTTP) | Stateless; horizontal behind LB |
| **Submission Service** | 8083 | ZIP ingestion, pipeline state, log streaming | Redis Pub/Sub, PostgreSQL | Stateless; shared volume mount |
| **Container Runner** | — | `docker build`, image tagging, Dockerfile gen | Deployment Service, Docker socket | Single instance (Docker socket) |
| **Deployment Service** | 8084 | `docker run`, port allocation, health validation| Benchmark Service, Docker socket | Single instance (port pool) |
| **Benchmark Service**| 8082 | Session lifecycle, watchdog, final score | Bot Worker (HTTP), PostgreSQL | Stateless; queue in Go channel |
| **Bot Worker** | 8085 | Goroutine pool, persona mix, `XADD` publish | Redis Streams, Contestant Container | Horizontal; fan-out via Kafka (roadmap)|
| **Telemetry Service** | 8081 | `XReadGroup` consumer, aggregators, WS broadcast| Redis, PostgreSQL, WebSocket clients | Horizontal; Redis consumer groups |
| **Leaderboard Service**| 8086 | Rankings, upsert, tie-breaking, rank calc | PostgreSQL | Read replicas (roadmap) |

#### Critical Architectural Decisions
*   **Trust Boundary at API Gateway:** The API Gateway validates HMAC-SHA256 JWTs and injects `X-User-Id` / `X-Team-Id` headers. Downstream services implicitly trust these headers, eliminating token re-validation on the hot path.
*   **Atomic Persona Distribution:** Personas are pre-shuffled into a deterministic array. Each goroutine claims its slot via `atomic.AddInt64` — guaranteeing exact statistical distribution regardless of OS scheduling.

---

## 06 | Submission Lifecycle & Workflow Procedures

The platform abstracts away massive complexity. Here is the step-by-step lifecycle of a submission:

| Stage | Input | Success Gate | Failure Action |
|---|---|---|---|
| **UPLOAD** | ZIP + metadata | ≤100MB, `.zip`, Language check | Discard; prompt retry |
| **BUILD** | ZIP path + ID | `docker build` exit 0 (≤5 min) | Mark FAILED; stream error logs to UI |
| **DEPLOY** | Docker image | `docker run` success, no crash | Remove container; mark FAILED |
| **VALIDATION**| Container URL | `GET /health` → 200, `POST /order` → 2xx| Destroy container; report route error |
| **WARMUP** | Validated URL | Initial load to JIT compile hot paths | Container crash marks ABORTED |
| **BENCHMARK** | Validated URL | All N requests dispatched cleanly | Watchdog fires; marks ABORTED |
| **SCORING** | Redis metrics | Metrics consumed & aggregated | Default 0 TPS; admin reviews logs |
| **LEADERBOARD**| Final row | `ON CONFLICT` upsert succeeds | Re-fetch on WebSocket reconnect |

> [!TIP]
> **Real-Time Build Log Streaming:** Build events are published to Redis Pub/Sub AND written to Postgres simultaneously. On UI reconnect, the system replays historical logs from the DB then tails the live stream — guaranteeing zero missed messages.

### 🔌 Target Engine API Contract
To successfully pass the **VALIDATION** phase, the target engine must expose `GET /health` and `POST /order`. The `/order` response must strictly match the following JSON schema:
```json
{
  "status": "accepted",
  "latency": 12
}
```

*(Note: Platform authentication via the API Gateway uses stateless JWTs valid for 1 hour, obtained via `POST /api/v1/auth/login`.)*

---

## 07 | Benchmark Engine & Trading Personas

The Bot Worker generates deterministic, stateful trading traffic — not random HTTP noise.

| Persona | Mix | Real-World Analogy | Weakness Targeted | Example Trade |
|---|---|---|---|---|
| **Retail Trader** | 60% | Mobile app investor | Connection pool, routing overhead | Buy 5 AAPL @ $104 |
| **Market Maker** | 20% | Citadel liquidity desk | Matching core (cascading fills) | Sell 75 MSFT @ $106 |
| **Scalper** | 10% | HFT day trader | Race conditions (spread-crossing) | Sell 2 TSLA @ $101 |
| **Whale** | 5% | Institutional fund | Deep book traversal, memory allocs | Buy 4000 AMZN @ $120 |
| **HFT Stressor** | 5% | Broken algo bot | Float overflow, tree depth errors | Buy AAPL @ $250 |

| **Tracer** | *5% override* | Financial auditor | Functional correctness & receipts | BUY 10@100 → Resting; SELL 10@100 → Filled |

---

## 08 | Algorithmic Scoring System

BenchForge scores using a brutal, compound mathematical formula based directly on the actual SQL aggregation:
**`Score = TPS × (SuccessRate / 100.0) × (250 / (250 + P99)) × (Correctness / 100)² × (Concurrency / 100)²`**

1.  **Effective TPS:** `TPS × (SuccessRate%)`
2.  **P99 Factor:** `250 / (250 + P99_ms)` — Exponential damping for tail latency.
3.  **Correctness Penalty:** `(Correctness Score / 100)²` — Massive quadratic penalty. 90% correctness drops your multiplier to 0.81x.
4.  **Concurrency Penalty:** `(Concurrency Score / 100)²` — Massive quadratic penalty for unstable threading.

### Tie-Breaking Cascade
1. `final_score` (DESC)
2. `success_rate` (DESC)
3. `p99 latency` (ASC)
4. `tps` (DESC)
5. `created_at` (ASC)

---

## 09 | Telemetry & Replay Engine

### At-Least-Once Delivery Guarantee
Bot Workers publish fire-and-forget metrics to Redis Streams. The Telemetry Service consumes them. `XAck` is called *only after* the metric has been inserted into Postgres AND added to all three in-memory aggregators. If the service crashes, Redis redelivers un-acknowledged messages. Zero data loss.

### 1Hz Broadcast Architecture
A dedicated ticker goroutine calls `.Snapshot()` on aggregators every second. The JSON payload (TPS, P50/90/99, breakdowns) is broadcast to all connected WebSocket clients simultaneously.

### The 20-Bucket Replay Engine
The Replay Engine transforms raw telemetry into a structured timeline serialized into a highly optimized JSON blob (containing `total_duration_ms`, `insights` arrays for latency spikes, and `timeline` bucket metrics) to prevent frontend crashes during playback.
*   **Postgres Window Functions:** Millions of rows are aggregated natively in the database (`PERCENTILE_CONT`), grouping data into 20 buckets (5% chunks of the benchmark).
*   **Automatic Anomaly Detection:**
    *   `LATENCY_ANOMALY`: `curr.P99 > prev.P99 × 1.5` (Identifies GC pauses or lock contention).
    *   `RECOVERY`: `curr.P99 < prev.P99 × 0.5` (Queue drain, cache warm-up).
    *   `PERSONA_SURGE`: Whale volume > 30% of bucket.
    *   `FATAL_ERROR`: Container OOMKill detected.

---

## 10 | Observability & Distributed Tracing

BenchForge treats observability as a first-class citizen to ensure pinpoint accuracy during post-mortems.
*   **Distributed Tracing:** The platform implements strict `X-Request-ID` propagation across all 7 microservices. This allows logs to be correlated across the API Gateway, deployment instances, and telemetry queues.
*   **Engine Metrics (`/metrics`):** The internal Mock Exchange exposes custom Prometheus metrics that contestants are encouraged to implement: `http_requests_total`, `http_request_duration_seconds` (latency histograms), and `active_requests` (concurrent in-flight tracking).

---

## 11 | User Interface & Admin Control Plane

The platform ships with a sleek, dark-mode, high-fidelity React/Next.js frontend.

### 👥 User Dashboard & Sidebar
*   **Overview:** High-level team rank, average TPS, and historical P99 charts.
*   **Submissions:** Upload zipped engines. View CI/CD build logs and artifacts.
*   **Deployments:** Live view of active containers, `stdout`/`stderr` streaming, and health checks.
*   **Benchmark Runs:** The execution control plane. Trigger blasts and view live WebSocket TPS dials and latency histograms.
*   **Global Leaderboard:** The competitive arena ranking all teams.

### 🛠️ Administrator Control Plane
*(Admin Login: `admin@benchforge.io`)*
*   **Cluster Health Topology:** Real-time visual node graphs of CPU/Memory and Redis backlogs.
*   **Submission Moderation:** Kill rogue deployments, ban images, or force-restart orchestration.
*   **System Audit Logs:** Immutable traces of every user action.

---

## 12 | Database & Security Architecture

### Database Design (PostgreSQL)
*   **`auth_users`:** Uses `bcrypt` hashing.
*   **`leaderboard_entries`:** Denormalized, read-optimized cache. Final score and rank are pre-computed at write time. Reads are sub-millisecond.
*   **`benchmark_replays`:** Stores the 20 pre-aggregated buckets as a JSONB blob, eliminating runtime aggregation queries during frontend playback.

### Security Architecture (Defense-in-Depth)
*   **API Gateway:** HMAC-SHA256 JWT validation ensures contestants cannot access admin routes.
*   **Container Isolation:** Contestant code runs in Docker containers on isolated bridge networks with no Docker socket access, no host volume mounts, and no external internet egress.
*   **Resource Exhaustion:** Docker daemon-level CPU/Memory quotas via cgroups prevent noisy-neighbor attacks.

---

## 13 | Scalability & Future Roadmap

**Current Single-Node Capacity:**
*   10,000–20,000 TPS via 100 goroutines.
*   ~15,000 metrics/sec ingestion via Redis Streams.
*   Unlimited WebSocket clients (goroutine-per-connection).

**Strategic Roadmap:**
*   **1 Month:** Multi-language support (Python, Java, Rust, Node.js) via automatic Dockerfile generation. Enhanced Linux cgroup resource limits.
*   **3 Months:** Multi-contest support, historical trend analytics, and side-by-side run comparisons in the Replay Engine.
*   **6 Months:** Kubernetes Migration. Horizontal HPA scaling for Telemetry, Kafka-coordinated fan-out for Bot Workers (scaling to millions of TPS across regions).
*   **1 Year:** AI-assisted bottleneck detection and root-cause analysis based on telemetry data.

---

## 14 | 🚀 Quick Start & Deployment

### 1. Clone the Repository
```bash
git clone https://github.com/RohitChavan16/IICPC_BenchForge.git
cd IICPC_BenchForge
```

### 2. Environment Setup
Each microservice requires environment variables to connect to Redis and Postgres.
```bash
cp .env.example .env
# Optional: customize .env for your specific deployment needs
```
*(See the [Environment Configuration](./docs/environment.md) guide for detailed variable documentation. Key tuning variables include `MAX_CONCURRENCY` (default 1000), `LOG_LEVEL`, and `CONSUMER_GROUP`)*.

### 3. Production Deployment Notes
*   **Docker Builds:** Go microservices use multi-stage builds resulting in statically linked `scratch` or alpine images under 15MB.
*   **Boot Topology:** Docker Compose follows a strict dependency boot sequence: State Layers (Redis/Postgres) ➡️ Exporters ➡️ Core Services ➡️ Observability Stack.
*   **Hardware Recommendations:** For extreme scaling, it is recommended to enable Redis AOF (Append Only File) to prevent data loss on pod eviction, and use network-optimized AWS `c5n` instances for Bot Workers.

### 4. Boot the Distributed Backend Cluster
Deploy the entire massive microservices stack using Docker Compose from the root directory:
```bash
docker compose up --build -d
```

### 5. Verify Active Backend Services
The following core services will immediately bind and boot:

**Control & Data Planes:**
- **API Gateway:** `http://localhost:8080`
- **Telemetry Service:** `http://localhost:8081`
- **Benchmark Service:** `http://localhost:8082`
- **Submission Service:** `http://localhost:8083`
- **Leaderboard Service:** `http://localhost:8084`
- **Bot Worker:** `http://localhost:8085`
- **Deployment Service:** `http://localhost:8091`
- **Mock Exchange:** `http://localhost:9000`

**Observability Stack:**
- **Grafana Dashboards:** `http://localhost:3000`
- **Prometheus Time-Series:** `http://localhost:9090`
- **cAdvisor (Container Metrics):** `http://localhost:8088`
- **Redis Exporter:** `http://localhost:9121`
- **Postgres Exporter:** `http://localhost:9187`

### 6. Boot the React Frontend
The high-fidelity Vite frontend must be started separately. In a new terminal window:
```bash
cd frontend/iicpc-frontend
npm install
npm run dev
```
The User Interface will now be accessible at:
- **BenchForge UI:** `http://localhost:5173` (or the port specified by Vite in your console)

---

## 15 | Deep-Dive Repository Structure

BenchForge is organized as a highly modular monolith. Every microservice is completely decoupled, containerized, and independently scalable.

```text
IICPC_BenchForge/
├── frontend/                     # Next.js/React powered frontends
│   ├── admin-dashboard/          # Administrative control plane for orchestrating runs
│   └── leaderboard/              # Real-time WebSockets-driven competitive leaderboard
├── services/                     # Independent Golang microservices
│   ├── api-gateway/              # Unified REST API routing and rate-limiting ingress
│   ├── benchmark-service/        # Orchestrates the lifecycle of benchmarks, queueing, and scoring
│   ├── bot-worker/               # The core distributed load generation engine & scenario executor
│   ├── container-runner/         # Securely executes isolated engine submissions
│   ├── deployment-service/       # Manages Docker deployments, network bridges, and port allocations
│   ├── leaderboard-service/      # In-memory ranked aggregations and WebSocket broadcasting
│   ├── mock-exchange/            # A baseline reference implementation of a trading system
│   ├── submission-service/       # Handles binary/code uploads, validation, and team registration
│   └── telemetry-service/        # High-throughput Redis Stream consumption and metric persistence
├── proto/                        # Protocol Buffers (gRPC) definitions for inter-service RPC
├── docs/                         # Extensive architectural deep-dives and engineering specifications
├── deployments/                  # Kubernetes manifests, Helm charts, and robust docker-compose topologies
│   ├── prometheus/               # Prometheus scraping configurations
│   └── grafana/                  # Pre-configured Grafana dashboards for cluster observability
├── sample-engines/               # Known-good baseline engines (e.g., Go Engine) to test against
└── scripts/                      # DB migration tools, CI/CD helpers, and local dev bootstrapping
```

---

## 16 | 📚 Documentation Links

Deep dive into the BenchForge internals:

- [Architecture Design](./docs/architecture.md)
- [Benchmark Lifecycle & Engine](./docs/benchmarking.md)
- [Benchmark Engine Specifics](./docs/benchmark-engine.md)
- [Telemetry Pipeline](./docs/telemetry.md)
- [Replay Engine Internals](./docs/replay-engine.md)
- [API Overview](./docs/api-overview.md)
- [API v1 Specification](./docs/api_v1_spec.md)
- [Deployment & Operations](./docs/deployment.md)
- [Environment Configuration](./docs/environment.md)
- [Observability Stack](./docs/observability.md)
- [Roadmap](./docs/roadmap.md)
- [Coding Standards](./docs/coding-standards.md)
- [Screenshots](./docs/screenshots.md)

---

## 17 | How to Test & Demo

BenchForge is a complete, running distributed system. To test the platform:

1.  **Landing Page:** Introduction to the platform.
2.  **User Registration:** Create a contestant account.
3.  **Contest Dashboard:** View the submission portal.
4.  **Submit Trading Engine:** Upload the `sample-engines/go-engine.zip`.
5.  **Build & Deployment:** Watch automatic extraction, containerization, and validation.
6.  **Benchmark Report:** Run the blast. View TPS, latency metrics, and score.
7.  **Replay Engine ⭐:** Replay the execution to visualize traffic, latency spikes, and anomalies over the 20-bucket timeline.
8.  **Leaderboard:** Check your real-time ranking.
9.  **Admin Login:** (`admin@benchforge.io`) Access the global control panel.

---

## 18 | 🤝 Open Source Contribution

This platform operates at the bleeding edge of Golang performance. We welcome PRs from distributed systems architects, database tuners, and HFT engineers. 
*   **Performance Standard:** PRs modifying the `bot-worker` or `telemetry-service` must include `pprof` flame graphs proving zero regressions in heap allocations or mutex contention.
*   See [CONTRIBUTING.md](./CONTRIBUTING.md) for architectural guidelines.

---

## 19 | 📄 License & Acknowledgements

Released under the **MIT License**.
Engineered specifically to solve the immense technical hurdles of the IICPC Hackathon, BenchForge establishes a new benchmark for how we measure extreme-throughput systems.

---