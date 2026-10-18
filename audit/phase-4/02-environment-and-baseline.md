# BenchForge Phase 4 — Test Environment and Baseline Configuration

**Audit Date:** 2026-10-17  
**Scope:** Test environment specifications, hardware baselines, deployment topology, and configuration audits.  
**Auditor:** Independent Senior Performance & Systems Auditor (Phase 4)

---

## 1. System Hardware & Operating Environment

All empirical performance benchmarks and test harnesses were executed on the following documented host environment:

| Specification | Configuration / Value | Verification Source |
| :--- | :--- | :--- |
| **Host System** | Lenovo 83GS (Laptop Workstation) | `systeminfo` |
| **CPU Model** | 12th Gen Intel(R) Core(TM) i5-12450HX | `Win32_Processor` |
| **CPU Core Architecture** | 8 Physical Cores (4 Performance Cores + 4 Efficient Cores) | `Win32_Processor` |
| **Logical Processors** | 12 Threads | `Win32_Processor` |
| **Base / Max Clock Speed** | 2.40 GHz (Base) / 4.40 GHz (Max Turbo) | Processor Specification |
| **Total Physical Memory (RAM)** | 11,996 MB (~12 GB DDR5) | `systeminfo` |
| **Available Physical Memory** | ~685 MB – 2,100 MB available during testing | `systeminfo` |
| **Virtual Memory Max Size** | 24,297 MB (Pagefile on `D:\pagefile.sys`) | `systeminfo` |
| **Operating System** | Microsoft Windows 11 Home Single Language (64-bit) | `systeminfo` (Build 26200) |
| **Go Compiler / Runtime** | `go version go1.26.3 windows/amd64` | `go version` |
| **Docker Engine** | Docker Version 29.3.0, build 5927d80 | `docker --version` |
| **Working Tree Commit** | `df4c8bf3b7a72a9c47ad4c6ba7754dd060adab32` | `git rev-parse HEAD` |
| **Working Tree State** | Pristine (Zero production code modifications; `?? audit/`) | `git status -s` |

---

## 2. Microservice Deployment Topology & Communication

BenchForge's multi-service architecture as declared in `docker-compose.yml` and inspected in source code:

```
+----------------------------------------------------------------------------------------------------+
|                                    BenchForge Deployed Topology                                    |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [External Client / Browser]                                                                      |
|             |                                                                                      |
|             | HTTP:8080 (REST API) & WS:8085 (Telemetry Streaming)                                 |
|             v                                                                                      |
|  +--------------------------------------------------------------------------------------------+    |
|  | api-gateway (:8080)                                                                        |    |
|  +--------------------------------------------------------------------------------------------+    |
|        |                  |                    |                     |                             |
|        | REST:8081        | REST:8082          | REST:8083           | REST:8085                   |
|        v                  v                    v                     v                             |
|  +--------------+  +------------------+  +-------------------+  +-------------------+              |
|  | auth-service |  |submission-service|  | benchmark-service |  | telemetry-service |              |
|  +--------------+  +------------------+  +-------------------+  +-------------------+              |
|                           |                        |                     |      ^                  |
|                           | REST:8091              | REST:8085           |      |                  |
|                           v                        v                     |      | Redis Streams    |
|                    +------------------+     +-------------------+        |      | (telemetry_stream)|
|                    | container-runner |     |    bot-worker     |--------+------+                  |
|                    +------------------+     +-------------------+                                  |
|                           |                        |                                               |
|                           v Docker run             v HTTP /order                                   |
|                    +------------------------------------+                                          |
|                    | [Participant Trading Engine]       |                                          |
|                    | (or mock-exchange:9000)            |                                          |
|                    +------------------------------------+                                          |
|                                                                                                    |
|  Shared Infrastructure:                                                                            |
|  - PostgreSQL 15: Single shared database (`benchforge`) on port 5432                               |
|  - Redis 7: Single shared instance (`telemetry_stream`, `pipeline_logs`) on port 6379              |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Component Resource Configurations & Limits

### 3.1 Database Connection Pools
- **PostgreSQL (`telemetry-service` & `benchmark-service`)**:
  - Uses `github.com/jackc/pgx/v5/pgxpool`.
  - Default connection pool configuration: `max_conns = 10`, `min_conns = 2`.
  - `max_conn_lifetime = 1 hour`, `max_conn_idle_time = 30 minutes`.
  - Under load, all consumer threads compete for these 10 connections.

### 3.2 Redis Client Configuration
- **Bot Worker & Telemetry Service**:
  - Uses `github.com/redis/go-redis/v9`.
  - Default pool size: 10 connections per CPU core (~120 connections).
  - Stream name: `telemetry_stream` (consumer group: `telemetry_group`).
  - Read batch size: `Count: 100`, `Block: 2 * time.Second`.

### 3.3 HTTP Transport Configuration
- **Bot Worker Client (`services/bot-worker/internal/bots/bots.go:16-32`)**:
  ```go
  maxConns := workerCount * 2
  if maxConns < 100 { maxConns = 100 }
  Transport: &http.Transport{
      MaxIdleConns:        maxConns,
      MaxIdleConnsPerHost: maxConns,
      MaxConnsPerHost:     maxConns,
      IdleConnTimeout:     90 * time.Second,
  }
  ```
  - While pool sizing parameters appear generous, **connection reuse fails completely** because `resp.Body.Close()` is never called in `pool.go:158` (BF-P4-002), rendering the idle connection pool useless.

---

## 4. Baseline Idle State Measurements

Prior to initiating load testing, the idle resource consumption was recorded:

| Component / Metric | Idle Measurement | Notes |
| :--- | :--- | :--- |
| **Host System CPU** | 1.8% – 4.2% | Baseline Windows background processes |
| **Host System RAM Available** | ~1.8 GB | Operating system + IDE background memory |
| **PostgreSQL Active Connections** | 1 connection | Idle monitoring handle |
| **Redis Memory Consumption** | 1.2 MB | Empty stream / zero keys |
| **Goroutine Count (Idle Services)** | 14 – 22 goroutines | Background tickers (watchdog, consumer loop) |

---

## 5. Baseline Lifecycle Overhead (Zero-Load Execution)

Even with zero trading orders, BenchForge imposes a mandatory static initialization delay for every benchmark:

1. **Pre-Validation Scenarios**: 6 sequential HTTP scenarios to the target engine (~350–500ms).
2. **Hardcoded Warmup Period**: In `services/bot-worker/cmd/worker/main.go:227`:
   ```go
   warmupCtx, cancelWarmup := context.WithTimeout(ctx, 5*time.Second)
   ```
   A static **5,000 millisecond delay** is enforced before any benchmark requests are counted or recorded.
3. **Queue Polling & DB Updates**: ~250ms for initial status updates and channel setup.

> **Baseline Overhead Floor:** The absolute minimum elapsed time for any benchmark execution in BenchForge is **5.6 to 6.2 seconds**, regardless of whether the workload requests 1 order or 100,000 orders.
