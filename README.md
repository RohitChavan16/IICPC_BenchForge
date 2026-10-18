# ⚡ BenchForge

> A distributed benchmarking and telemetry platform designed to evaluate high-concurrency trading engines, containerized microservices, and system performance under simulated market load.

**Team:** VakraNode  
**Single Team Member:** Rohit Chavan  
**Institution:** COEP Technological University, Pune  

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8.svg)](https://golang.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg)](https://www.docker.com/)
[![Status: Functional Prototype](https://img.shields.io/badge/Status-Functional_Prototype-2ea44f.svg)]()

---

## 01 | Executive Summary & Vision

**BenchForge** is a distributed load generation and telemetry pipeline built to objectively benchmark trading engine architectures under simulated market conditions. It containerizes contestant submissions, generates concurrent load using stateful trading personas, streams telemetry through an event-driven Redis Streams pipeline, and ranks teams in real time with an automated, quantitative scoring system.

### Why It Was Built
Hackathons typically evaluate slide decks and static prototypes rather than system reliability. BenchForge was built to test deployed microservices under sustained concurrent trading traffic — measuring actual throughput, latency percentiles, and state correctness rather than presentation polish.

### What Makes It Different
Unlike basic HTTP benchmark tools (`wrk`, `jmeter`) that blast static requests without state awareness, BenchForge includes:
* **Six stateful trading personas** simulating realistic market order patterns.
* **At-least-once Redis Streams telemetry pipeline** decoupling load generation from storage.
* **20-bucket Replay Engine with anomaly flagging** to review latency spikes and failures over time.
* **Tracer persona** to verify order matching correctness and prevent empty HTTP 200 spoofing.

### Architecture & Implementation Scope
Designed and implemented as an end-to-end engineering project by Rohit Chavan (2nd-year ECE student at COEP Tech):
*   **9 Go Microservices** (API Gateway, Submission, Container Runner, Deployment, Benchmark, Bot Worker, Telemetry, Leaderboard, Mock Exchange)
*   **Redis Streams Telemetry Pipeline**
*   **Goroutine Worker Pool** (configurable concurrency)
*   **6 Trading Personas**
*   **Tracer Correctness Validator**
*   **20-Bucket Replay Engine**
*   **Automated Anomaly Flagging**
*   **Live WebSocket Leaderboard**
*   **Prometheus + Grafana Monitoring**
*   **Docker Container Isolation**
*   **PostgreSQL Window Functions for Percentiles**
*   **Graceful Shutdown Handling**

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

## 04 | Engineering Challenges & Practical Solutions

Core architectural decisions made to handle concurrent benchmarking, data persistence, and validation:

| Challenge | Problem | Solution | Result |
|---|---|---|---|
| **Load Generation Bottleneck** | Goroutines writing directly to Postgres saturate connection pools and slow down load generation. | Redis Streams as a decoupled buffer: Workers emit metrics via `XADD` asynchronously. Telemetry Service processes in batches. | Load generation runs without I/O blocking from database writes. |
| **Correctness Validation** | Target engines could return dummy HTTP `200 OK` responses without implementing real matching logic. | Tracer Persona (5% sample): executes sequential BUY (assert resting) and SELL (assert filled with matched receipt). | Prevents hollow 200 OK responses from falsely inflating scores. Correctness% is squared in the scoring formula. |
| **Replay Without Raw Scan** | Iterating over millions of raw telemetry rows in application memory causes high memory overhead. | PostgreSQL Window Functions (`PERCENTILE_CONT` + cumulative counts) aggregate data into 20 normalized buckets directly in DB. | Reduces application memory usage and speeds up replay timeline generation. |
| **Real-Time Analytics** | Repeatedly querying PostgreSQL for live telemetry under load causes query spikes. | In-memory aggregators (Global, Per-Worker, Per-Persona) updated from the Redis stream; a 1Hz ticker pushes WebSocket updates. | Sub-second dashboard updates without read contention on the database hot path. |
| **Leaderboard Consistency** | Concurrent benchmark completions could overwrite higher historical scores via race condition. | PostgreSQL `ON CONFLICT` upsert with conditional check: `WHERE EXCLUDED.final_score > leaderboard_entries.final_score`. | Atomically preserves each team's highest valid score. |

---

## 05 | High-Level Architecture & Microservices

BenchForge is organized into three operational planes to isolate load generation from metric processing and observability:

*   **Control Plane:** API Gateway, Submission Service, Deployment Service, Benchmark Service, Container Runner.
*   **Data Plane:** Bot Worker, Redis Streams, Telemetry Service, PostgreSQL, Leaderboard Service.
*   **Observability Plane:** Prometheus, Grafana, cAdvisor, Redis Exporter, Postgres Exporter.

### Microservices Breakdown

| Service | Port | Responsibility | Communicates With | Scaling Strategy |
|---|---|---|---|---|
| **API Gateway** | 8080 | JWT auth, RBAC, reverse proxy | All services (HTTP) | Stateless; horizontal behind LB |
| **Submission Service** | 8083 | ZIP ingestion, pipeline state, build logs | Redis Pub/Sub, PostgreSQL | Stateless; shared volume mount |
| **Container Runner** | — | `docker build`, image tagging | Deployment Service, Docker socket | Worker instance (Docker socket) |
| **Deployment Service** | 8091 | `docker run`, port allocation, health checks | Benchmark Service, Docker socket | Single instance (port pool) |
| **Benchmark Service**| 8082 | Session lifecycle, execution state, final score | Bot Worker (HTTP), PostgreSQL | Stateless |
| **Bot Worker** | 8085 | Goroutine pool, persona execution, `XADD` publish | Redis Streams, Target Container | Horizontal worker instances |
| **Telemetry Service** | 8081 | `XReadGroup` consumer, aggregators, WS push | Redis, PostgreSQL, WebSocket clients | Consumer group workers |
| **Leaderboard Service**| 8084 | Rankings, WebSocket streaming | PostgreSQL | Read replicas |

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

BenchForge scores submissions using a multi-factor formula that evaluates throughput, tail latency, and verified correctness:
**`Score = TPS × (SuccessRate / 100.0) × (250 / (250 + P99)) × (Correctness / 100)² × (Concurrency / 100)²`**

1.  **Effective TPS:** `TPS × (SuccessRate%)` — Throughput adjusted by request success.
2.  **P99 Factor:** `250 / (250 + P99_ms)` — Tail latency penalty factor.
3.  **Correctness Multiplier:** `(Correctness Score / 100)²` — Quadratic penalty for failed tracer orders. A 90% correctness rate reduces the multiplier to 0.81x.
4.  **Concurrency Multiplier:** `(Concurrency Score / 100)²` — Penalizes race conditions and severe latency divergence under load.

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
*   **Distributed Tracing:** The platform implements strict `X-Request-ID` propagation across all 9 microservices. This allows logs to be correlated across the API Gateway, deployment instances, and telemetry queues.
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

**Current Tested Single-Node Capacity:**
*   Up to 10,000+ TPS against lightweight backends under local loopback.
*   High-throughput asynchronous metric ingestion buffered through Redis Streams.
*   Concurrent WebSocket dashboard connections handled via dedicated client goroutines.

**Development Roadmap:**
*   **Near-term:** Extended language support (Python, Java, Rust) and enhanced Linux cgroup container resource quotas.
*   **Mid-term:** Multi-contest support, run-to-run comparison views in the Replay Engine.
*   **Long-term:** Multi-node worker clustering for horizontal load fan-out.

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

## 🖼️ Platform Screenshots

<div align="center">

  <img src="./demo/Screenshot 2026-06-12 212619.png" width="48%" style="margin: 1%;"/>
  <img src="./demo/Screenshot 2026-06-12 213346.png" width="48%" style="margin: 1%;"/>

  
  <img src="./demo/Screenshot 2026-06-12 212838.png" width="48%" style="margin: 1%;"/>
  <img src="./demo/Screenshot 2026-06-13 225005.png" width="48%" style="margin: 1%;"/>
</div>

👉 **[Click here to view the full UI Screenshot Gallery](./docs/SCREENSHOT_GALLERY.md)**

---
## 🏛️ Architecture & Data Flow Diagram

The complete architecture diagrams and data flows are documented in **[benchforge_architecture.html](./benchforge_architecture.html)**.

<div align="center">
  <img src="./demo/Screenshot 2026-06-14 161754.png" width="48%" style="margin: 1%;"/>
  <img src="./demo/Screenshot 2026-06-14 161818.png" width="48%" style="margin: 1%;"/>
  <img src="./demo/Screenshot 2026-06-14 161838.png" width="48%" style="margin: 1%;"/>
  <img src="./demo/Screenshot 2026-06-14 161920.png" width="48%" style="margin: 1%;"/>
</div>

---

## 17 | How to Test & Demo

BenchForge is designed to run locally using Docker Compose:

1.  **Landing Page:** Overview of contest rules and platform status.
2.  **User Registration:** Create a participant or contestant account.
3.  **Contest Dashboard:** Access the engine submission interface.
4.  **Submit Trading Engine:** Upload a sample engine (e.g. `sample-engines/go-engine.zip`).
5.  **Build & Deployment:** Observe build logs, container initialization, and route validation.
6.  **Run Benchmark:** Trigger load generation to record TPS, error rates, and latency distributions.
7.  **Replay Engine:** Review the 20-bucket execution timeline and inspect flagged anomalies.
8.  **Leaderboard:** View updated rankings and score breakdowns.
9.  **Admin Panel:** (`admin@benchforge.io`) Manage active runs, nodes, and submissions.

---

## 18 | 🤝 Contributing

Contributions, issues, and performance discussions are welcome! If you're interested in concurrency tuning, telemetry pipelines, or testing methodologies:
*   Check out [CONTRIBUTING.md](./CONTRIBUTING.md) for code structure, guidelines, and testing requirements.
*   Run tests and linting (`go test ./...`) before opening a pull request.

---

## 19 | 📄 License & Acknowledgements

Released under the **MIT License**.  
Developed as an engineering project for the IICPC Hackathon to explore automated, objective evaluation of concurrent backend microservices under simulated market workloads.

---