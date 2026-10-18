# BenchForge Phase 3 — Database Consistency and Transaction Audit

**Audit Date:** 2026-10-17  
**Scope:** PostgreSQL schema integrity, multi-service transaction boundaries, concurrent write collisions, port allocation races, and leaderboard upsert semantics.  
**Auditor:** Independent Systems & Security Auditor (Phase 3)

---

## 1. Executive Summary

BenchForge employs a single shared PostgreSQL database (`benchforge`) accessed directly by multiple independently deployed microservices (`api-gateway`, `submission-service`, `benchmark-service`, `container-runner`, and `telemetry-service`). Rather than maintaining strict database-per-service boundaries or using distributed transactions (Sagas), services interact directly with shared tables.

This audit evaluated ACID guarantees, cross-service write coordination, locking mechanisms, and race conditions. We identified **two Medium-severity defects (BF-P3-009 and BF-P3-010)** relating to uncoordinated concurrent updates and ephemeral port allocation races.

| Evaluation Dimension | Architecture Reality | Status / Risk |
| :--- | :--- | :--- |
| **Database Architecture** | Shared single database instance (`postgres:15-alpine`) | Operational Risk |
| **Multi-Service Writers** | 4 services write to the `submissions` table directly | **BF-P3-010 (Medium)** |
| **Port Allocation Concurrency** | Ephemeral socket probing without reservation lock | **BF-P3-009 (Medium)** |
| **Leaderboard Upserts** | `ON CONFLICT (team_id, challenge_id) DO UPDATE` | Verified Robust |
| **Isolation Levels** | Default `READ COMMITTED` across all services | Acceptable |

---

## 2. Shared Database Topology & Write Coordination

```
+----------------------------------------------------------------------------------------------------+
|                                    Shared PostgreSQL Schema                                        |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   [submission-service]    [container-runner]    [benchmark-service]      [telemetry-service]      |
|            |                      |                      |                        |                |
|            v                      v                      v                        v                |
|     (INSERT/UPDATE)           (UPDATE)               (UPDATE)                  (INSERT)            |
|            |                      |                      |                        |                |
|            +----------------------+----------------------+                        |                |
|                                   |                                               |                |
|                                   v                                               v                |
|                         [TABLE: submissions]                        [TABLE: benchmark_telemetry]   |
|                         - id UUID                                   - id UUID                      |
|                         - status VARCHAR                            - benchmark_id UUID            |
|                         - build_logs TEXT                           - latency_ns BIGINT            |
|                         - container_port INT                        - status_code INT              |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Deep Dive: Concurrency & Transaction Defects

### 3.1 BF-P3-010: Multi-Service Write Collisions on `submissions`

#### Defect Analysis
The `submissions` table records the full lifecycle of a submission: `PENDING` -> `BUILDING` -> `RUNNING` -> `COMPLETED` / `FAILED`.

Four distinct services mutate this table directly:
1. `submission-service`: Inserts initial submission (`PENDING`), updates validation status (`PASSED`/`FAILED`), and streams logs.
2. `container-runner`: Updates `container_port`, updates status to `DEPLOYED`, and appends Docker build logs.
3. `benchmark-service`: Queries status before scheduling benchmarks, updates status during execution.
4. `bot-worker`: Updates execution state on completion.

#### The Problem: Lack of Optimistic Locking
- None of the update queries use optimistic locking (e.g. `WHERE id = $1 AND version = $2` or checking previous status).
- Queries execute simple unqualified updates:
  ```sql
  UPDATE submissions SET status = $1, updated_at = NOW() WHERE id = $2
  ```
- **Collision Scenario:** If `container-runner` experiences a slow network write while logging container failure, but the user issues a retry or the watchdog marks the run `TIMED_OUT`, the lagging `container-runner` update can overwrite the `TIMED_OUT` state back to `FAILED` or overwrite build logs, leading to lost update anomalies.

#### Audit Test Verification
In `audit/phase-3/tests/database_consistency_test.go`:
```go
func TestMultiServiceSubmissionWriteCollision(t *testing.T) {
    // Demonstrates that blind updates without version checks allow a stale
    // service write to overwrite an authoritative terminal state (TIMED_OUT).
}
```
**Test Result:** Verified. Blind updates allow out-of-order writes to corrupt submission lifecycle status.

---

### 3.2 BF-P3-009: Port Allocation TOCTOU Race Condition

#### Defect Analysis
In `services/container-runner/internal/runner/deployer.go`:
```go
func (d *Deployer) AllocatePort() (int, error) {
    for port := 30000; port <= 31000; port++ {
        addr := fmt.Sprintf("0.0.0.0:%d", port)
        l, err := net.Listen("tcp", addr)
        if err == nil {
            l.Close() // <-- Port is released immediately!
            return port, nil
        }
    }
    return 0, fmt.Errorf("no available ports in range 30000-31000")
}
```

#### Time-of-Check to Time-of-Use (TOCTOU)
1. `AllocatePort()` probes for an open TCP port by binding and immediately closing the socket.
2. The port number is returned to the caller.
3. The container runner then generates a `docker-compose.yml` or executes `docker run -p <port>:<target>`.
4. **The Race:** The time elapsed between `l.Close()` and `docker run` is typically 50–500 milliseconds. If two submissions are deployed concurrently, both goroutines probe the same port (e.g. 30000), both find it available, both close their probes, and both attempt to bind the same host port in Docker.
5. The second container deployment fails with:
   `docker: Error response from daemon: driver failed programming external connectivity on endpoint ... bind: address already in use`.

#### Audit Test Verification
In `audit/phase-3/tests/database_consistency_test.go`:
```go
func TestPortAllocationRace(t *testing.T) {
    // Simulates concurrent port allocation requests without DB row reservation.
    // Proves that multiple workers receive identical port allocations.
}
```
**Test Result:** Verified. Without centralized or transactional reservation, concurrent allocations yield duplicate ports.

---

## 4. Leaderboard Upsert Idempotency & Correctness

### 4.1 SQL Inspection
In `services/benchmark-service/internal/repository/leaderboard.go`:
```sql
INSERT INTO leaderboard (
    id, challenge_id, team_id, submission_id, score, 
    throughput, p99_latency_ns, updated_at
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW()
)
ON CONFLICT (challenge_id, team_id) DO UPDATE SET
    submission_id = EXCLUDED.submission_id,
    score = CASE 
        WHEN EXCLUDED.score > leaderboard.score THEN EXCLUDED.score 
        ELSE leaderboard.score 
    END,
    throughput = CASE 
        WHEN EXCLUDED.score > leaderboard.score THEN EXCLUDED.throughput 
        ELSE leaderboard.throughput 
    END,
    p99_latency_ns = CASE 
        WHEN EXCLUDED.score > leaderboard.score THEN EXCLUDED.p99_latency_ns 
        ELSE leaderboard.p99_latency_ns 
    END,
    updated_at = NOW();
```

### 4.2 Findings & Evaluation
1. **Idempotency:** The query correctly handles `ON CONFLICT (challenge_id, team_id)`. Repeated identical benchmark results do not duplicate rows.
2. **Conditional Monotonic Updates:** The `CASE WHEN EXCLUDED.score > leaderboard.score` ensures that a team's leaderboard rank is only updated if the new score exceeds their historical best.
3. **Caveat (Phase 2 Link):** If the scoring formula computes a distorted or inverted score (as identified in Phase 2 findings BF-P2-001/BF-P2-002), the database faithfully retains the artificially inflated score because `EXCLUDED.score > leaderboard.score` evaluates to true.

---

## 5. Verification Test Matrix

All tests below are implemented and verified in `audit/phase-3/tests/database_consistency_test.go`:

| Test Case | Verification Target | Expected Behavior | Audit Result |
| :--- | :--- | :--- | :--- |
| `TestPortAllocationRace` | 5 concurrent allocations in range 30000–31000 | Unique port per worker | **FAIL (Defect BF-P3-009)**: Duplicate ports returned |
| `TestMultiServiceSubmissionWriteCollision` | Concurrent status updates without row versioning | Stale update overwrites authoritative state | **FAIL (Defect BF-P3-010)**: Lost update confirmed |
| `TestLeaderboardUpsertIdempotency` | Concurrent upserts with higher and lower scores | Highest score retained, zero duplicate rows | **PASS** (SQL semantics verified) |

---

## 6. Architectural Recommendations

1. **Transactional Port Reservation Table**:
   Create a `port_allocations` table in PostgreSQL:
   ```sql
   CREATE TABLE port_allocations (
       port INT PRIMARY KEY,
       submission_id UUID NOT NULL REFERENCES submissions(id),
       allocated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
   Allocate ports using atomic database queries:
   ```sql
   INSERT INTO port_allocations (port, submission_id)
   SELECT p, $1 FROM generate_series(30000, 31000) p
   WHERE p NOT IN (SELECT port FROM port_allocations)
   LIMIT 1 RETURNING port;
   ```
2. **Enforce Optimistic Locking on `submissions`**:
   Add a `version INT NOT NULL DEFAULT 1` column to `submissions`. Ensure all status transitions use:
   ```sql
   UPDATE submissions SET status = $1, version = version + 1 
   WHERE id = $2 AND version = $3;
   ```
