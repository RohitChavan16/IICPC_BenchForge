# BenchForge Phase 3 — Resource Exhaustion and Denial of Service Audit

**Audit Date:** 2026-10-17  
**Scope:** Memory allocation, file descriptors, database connection pools, disk consumption, and denial of service (DoS) vulnerabilities.  
**Auditor:** Independent Systems & Security Auditor (Phase 3)

---

## 1. Executive Summary

Benchmarking high-frequency trading engines produces massive volumes of network traffic, telemetry records, and log output. A benchmark execution system must be resilient against both accidental resource exhaustion (e.g., extremely large workloads) and malicious Denial of Service attacks (e.g., log flooding, connection exhaustion).

This audit analyzed resource boundaries across CPU, memory, socket descriptors, database pools, and disk storage. We identified critical exhaustion vectors in memory allocation (`BF-P3-007`), unconstrained build log storage, and database connection pool contention.

| Resource Vector | Vulnerability / Risk | Severity |
| :--- | :--- | :--- |
| **RAM (Bot-Worker)** | Unbounded channel buffering proportional to `TotalRequests` | **HIGH (BF-P3-007)** |
| **Disk (PostgreSQL)** | Uncapped `build_logs TEXT` column storage per submission | Medium |
| **Disk (Docker Logs)** | Engine containers lack Docker log rotation (`max-size`) | High |
| **Sockets (TCP/IP)** | Ephemeral port exhaustion under HTTP client connection churn | Medium |
| **Database Pool** | `pgxpool.Pool` connection starvation under high telemetry bursts | Medium |

---

## 2. Deep Dive: Resource Exhaustion Vectors

### 2.1 Bot-Worker Channel Allocation Spikes (BF-P3-007)
- **Vulnerability:** `bot-worker/internal/worker/runner.go` instantiates channels using `make(chan WorkloadJob, workload.TotalRequests)` and `make(chan JobResult, workload.TotalRequests)`.
- **Exhaustion Profile:**
  - 100,000 requests = ~16 MB RAM buffer overhead.
  - 1,000,000 requests = ~160 MB RAM buffer overhead.
  - 10,000,000 requests = ~1.6 GB RAM buffer overhead just for empty channel pointers.
- When combined with in-flight order payload structs and telemetry slices, a single high-throughput test causes the `bot-worker` process to exceed container memory limits and trigger kernel OOM killing.

---

### 2.2 Unconstrained Log Storage & Disk Exhaustion

#### Database Text Blobs
In `services/submission-service/internal/repository/submissions.go`:
```sql
UPDATE submissions SET build_logs = $1, status = $2 WHERE id = $3
```
- There is no truncation or maximum byte limit applied to `build_logs`.
- If a participant's Dockerfile runs a verbose build (e.g. compiling Boost or LLVM with verbose flags) or prints infinite output in a loop, the raw text can reach gigabytes.
- Storing unbounded multi-gigabyte text blobs directly in PostgreSQL TOAST tables severely degrades database I/O performance and can quickly exhaust disk space.

#### Container Stdout / Stderr Logging
In `services/container-runner/internal/runner/deployer.go`:
- Engine containers are launched without log driver rotation parameters (`--log-opt max-size=10m --log-opt max-file=3`).
- If an engine container prints to stdout on every order, a 1,000,000-order benchmark will generate hundreds of megabytes of JSON logs in `/var/lib/docker/containers/`.
- Over multiple runs, the host filesystem will reach 100% disk utilization, causing all Docker operations to fail.

---

### 2.3 Socket Descriptor & `TIME_WAIT` Exhaustion

#### HTTP Client Configuration in Bot Worker
In `services/bot-worker/internal/worker/client.go`:
- Bot workers issue thousands of HTTP requests per second to participant engines.
- If the HTTP client does not configure `MaxIdleConnsPerHost` properly:
  ```go
  // Default Go http.Transport has MaxIdleConnsPerHost = 2!
  ```
- With only 2 idle connections per host, concurrent worker goroutines repeatedly close and reopen TCP sockets.
- On Linux, closed TCP connections linger in `TIME_WAIT` for 60 seconds.
- At 5,000 requests/sec, the system rapidly exhausts the ephemeral port range (typically 28,000 available ports), causing `dial tcp: cannot assign requested address` errors and corrupting benchmark latency statistics.

---

### 2.4 PostgreSQL Connection Pool Contention

In `services/telemetry-service/internal/repository/telemetry.go`:
- Under load, `telemetry-service` uses `pgxpool.Pool` to execute batch inserts.
- The default pool size is `max_conns = 10`.
- If batch inserts take > 50ms due to disk I/O under heavy load, consumer worker threads queue up waiting for available database handles.
- As database queries back up, Redis Streams unacknowledged message queues grow, increasing Redis memory footprint.

---

## 3. Verification Test Matrix

All tests below are implemented and verified in `audit/phase-3/tests/concurrency_test.go`:

| Test Name | Verification Target | Expected Behavior | Audit Result |
| :--- | :--- | :--- | :--- |
| `TestChannelMemoryAllocation` | 1M items channel buffer allocation | High memory spike in unbounded queue | **PASS (Defect BF-P3-007 confirmed)** |
| `TestAtomicCounterConcurrency` | High-frequency counter mutations | Zero lost updates under thread saturation | **PASS** (Atomic operations verified safe) |

---

## 4. Architectural Recommendations

1. **Cap Channel Allocations (BF-P3-007 Fix)**:
   Limit buffer sizes to a fixed maximum (e.g. 10,000 items) and stream items from producer goroutines.
2. **Enforce Build Log Truncation**:
   In `submission-service`, cap build logs at 2 MB:
   ```go
   const MaxLogBytes = 2 * 1024 * 1024
   if len(logs) > MaxLogBytes {
       logs = logs[len(logs)-MaxLogBytes:] // Keep the last 2MB
   }
   ```
3. **Configure Docker Log Rotation**:
   Add `--log-opt max-size=20m --log-opt max-file=2` to all container runner execution commands.
4. **Tune Bot-Worker HTTP Transport**:
   Configure HTTP transport with `MaxIdleConns = 1000` and `MaxIdleConnsPerHost = 500` to prevent socket churn.
