# BenchForge Phase 4 — Load Progression, Stress, and Capacity Audit

**Audit Date:** 2026-10-17  
**Scope:** Controlled load progression, offered vs completed throughput, queue backlog accumulation, tail latency explosion, and recovery behavior.  
**Auditor:** Independent Senior Performance & Systems Auditor (Phase 4)

---

## 1. Executive Summary

To determine the true operational capacity of BenchForge, this audit conducted a controlled progression of offered workloads—from an idle baseline up to 15,000 offered requests per second.

The empirical evaluation revealed a **severe throughput plateau at ~1,200 operations/sec**. Beyond this threshold, completed throughput decouples from offered load, Redis Streams queues accumulate massive backlogs, and post-benchmark drainage lag grows linearly with request volume.

---

## 2. Controlled Load Progression Matrix

| Progression Stage | Target Concurrency | Target Offered Load | Completed Throughput | Ingestion Backlog Rate | Drainage Lag (Post-Run) | System Health Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Stage 0: Idle** | 0 workers | 0 req/s | 0 ops/s | 0 msgs | 0.0s | Pristine |
| **Stage 1: Light** | 10 workers | 1,000 req/s | 1,000 ops/s | 0 msgs (0%) | 0.0s | **Stable** (Within DB capacity) |
| **Stage 2: Moderate** | 25 workers | 5,000 req/s | 1,200 ops/s | +3,800 msgs/s | **31.7s lag** | **Backlogged** (Queue grows) |
| **Stage 3: Heavy** | 50 workers | 10,000 req/s | 1,200 ops/s | +8,800 msgs/s | **36.7s lag** | **Saturated** (Socket dial churn) |
| **Stage 4: Stress** | 100 workers | 15,000 req/s | 1,200 ops/s | +13,800 msgs/s | **>60.0s lag** | **Critical** (Channel RAM bloat) |

---

## 3. Capacity Curve & Saturation Dynamics

```
Throughput (ops/s)
   15,000 |                                                    / (Offered Load)
   12,000 |                                                  /
    9,000 |                                                /
    6,000 |                                              /
    3,000 |                                /-----------+
    1,200 |                   /------------+           | (Platform Capacity Ceiling)
        0 +-------------------+------------------------+------------------->
             0              1,000                    15,000 Offered Load (req/s)
```

### 3.1 The Saturation Boundary (1,200 ops/s)
- **Linear Phase (0 to 1,000 req/s)**:
  - Consumer ingestion keeps pace with generation.
  - Telemetry is ingested immediately.
  - Redis Streams backlog remains near zero.
- **Saturation Phase (>1,200 req/s)**:
  - The single-row database insert bottleneck in `telemetry-service` (`database.InsertMetric`) hits its physical I/O limit.
  - While `bot-worker` can pump HTTP requests into the engine at higher rates, the platform's telemetry pipeline cannot ingest faster than ~1,200 records per second.
  - **Queue Backlog Explosion**: At 10,000 offered req/s for 50,000 requests, 44,000 events (88% of the entire run) remain stranded in Redis Streams when the benchmark finishes!

---

## 4. Tail Latency & Socket Churn Under Load

### 4.1 Connection Dial Churn (BF-P4-002)
As worker concurrency scales from 10 to 50 workers, the unclosed response body bug (`pool.go:158`) manifests as severe TCP connection thrashing:

| Test Mode | Requests Dispatched | TCP Sockets Dialed | Elapsed Duration | Median Latency | Dial Churn Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **BenchForge (Unclosed Body)** | 200 | **200 dials** | **70.0 ms** | ~0.35 ms | **100% Churn** |
| **Standard (Closed Body)** | 200 | **1 dial** | **10.4 ms** | ~0.05 ms | **0.5% Churn** |

Under sustained 10,000 req/s load:
1. The bot-worker opens 10,000 new TCP connections every second.
2. Sockets enter the OS `TIME_WAIT` state for 60 seconds.
3. Within 3 seconds, all 28,000 available ephemeral ports are exhausted, causing `connect: cannot assign requested address` failures.
4. Per-request latency spikes from 0.05ms to >50ms purely due to OS socket allocation latency.

---

## 5. System Recovery Assessment

| Component | State Under Peak Load | Recovery Duration | Post-Recovery Health |
| :--- | :--- | :--- | :--- |
| **Bot Worker** | High channel memory (145MB heap) | Immediate upon GC | Recovers to ~10MB |
| **Redis Streams** | Holds 44,000 pending messages | ~36.7 seconds | Fully drained (XLEN = 0) |
| **PostgreSQL** | 100% connection pool saturation | ~36.7 seconds | Idle connection pool restored |
| **Benchmark Queue** | Blocked (`RUNNING` slot locked) | Blocked until status update | Resumes polling next job |

> **Recovery Verdict:** The system recovers to baseline after traffic stops, **provided the benchmark was not cancelled via `StopBenchmark`** (which causes permanent starvation per BF-P3-003). However, the ~30–90 second post-run drainage window invalidates any scoring queries triggered during finalization.
