# BenchForge Phase 2 Audit — Test Matrix and Execution Results

**Comprehensive Verification Catalog, Execution Evidence, and Test Baseline**

---

## 1. Test Environment and Execution Baseline

- **Operating System:** Windows 11 / Windows Server x86_64
- **Go Runtime:** `go version go1.26.3 windows/amd64`
- **Execution Mode:** Isolated deterministic test harness in `audit/phase-2/tests/`
- **Baseline Test Suite Command:** `go test ./...` in individual service directories
- **Phase 2 Audit Suite Command:** `go test -v .` inside `audit/phase-2/tests/`

---

## 2. Baseline Test Results (Pre-Audit Existing Tests)

| Service / Package | Test File | Test Functions | Execution Command | Result | Duration | Notes |
|---|---|---|---|---|---|---|
| `bot-worker/cmd/worker` | `percentiles_test.go` | `TestLatencyHistogram_Percentiles` | `go test -v ./...` | ✅ PASS | 0.00s | Validates 10k fixed-bucket histogram percentiles |
| `bot-worker/internal/scenario` | `executor_test.go` | `TestPartialFill`, `TestPriceImprovement`, `TestFIFOPriority`, `TestMultiLevelPriceSweep` | `go test -v ./...` | ✅ PASS | 0.03s | Tests `RunScenario` against httptest servers |
| `telemetry-service/internal/consumer` | `recovery_test.go` | `TestMessageRecovery` | `go test -v ./...` | ✅ PASS | 5.28s | Tests message reclamation for idle messages |

---

## 3. Phase 2 Structured Audit Test Matrix

| Test ID | Category | Requirement / Contract Under Test | Input / Test Fixture | Independently Derived Expected Output | Actual System Output | Status | Test Implementation & Evidence | Limitations |
|---|---|---|---|---|---|---|---|---|
| **BF-T2-001** | Unit / Oracle | Price-Time Priority resting and partial fill matching | Buy 100 @ 150, Sell 40 @ 150, Sell 60 @ 150 | ExecQty=40, then ExecQty=60, book empty | Status: `resting` $\to$ `filled` $\to$ `filled` | **PASS** | [`oracle_test.go:275-305`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/oracle_test.go#L275-L305) | Pure in-memory oracle |
| **BF-T2-002** | Unit / Oracle | Price Improvement execution price | Maker BUY 10 @ 100; Taker SELL 10 @ 90 | Trade price must be $100.00 (resting price) | Trade price: $100.00 | **PASS** | [`oracle_test.go:307-325`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/oracle_test.go#L307-L325) | Single pair |
| **BF-T2-003** | Unit / Oracle | FIFO queue ordering at identical price | Maker 1 (10@100), Maker 2 (20@100); Taker SELL 15 | Trade 1: 10 vs M1; Trade 2: 5 vs M2 | Trade 1: M1 (10); Trade 2: M2 (5) | **PASS** | [`oracle_test.go:327-345`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/oracle_test.go#L327-L345) | Single price level |
| **BF-T2-004** | Adversarial | Canned response engine detection | Server returns static pre-recorded scenario JSON | Engine should be flagged as fraudulent or non-matching | BenchForge returns `Passed: true, Status: PASSED` | **FAIL (Defect)** | [`oracle_test.go:410-432`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/oracle_test.go#L410-L432) | Exposes static scenario gaming |
| **BF-T2-005** | Adversarial | Price inversion engine detection | Server trades at taker price (90) instead of resting (100) | Scenario runner fails with price mismatch error | Runner returns `FAILED: expected 100.00, got 90.00` | **PASS** | [`oracle_test.go:434-455`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/oracle_test.go#L434-L455) | Verified detection capability |
| **BF-T2-006** | Workload | Persona mix deterministic seed reproducibility | $N=1000$ requests, `seed = 42` executed twice | Identical order sequence, exact 60/20/10/5/5 ratio | Sequences 100% identical; counts: 600/200/100/50/50 | **PASS** | [`workload_test.go:30-85`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/workload_test.go#L30-L85) | In-memory generation |
| **BF-T2-007** | Workload | Concurrent atomic persona routing | 100 goroutines consuming 10,000 requests via atomic counter | Exactly 10,000 items consumed, zero drops, zero duplicates | Exact 10,000 counter; retail=6000, MM=2000, etc. | **PASS** | [`workload_test.go:88-140`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/workload_test.go#L88-L140) | Tested without network I/O |
| **BF-T2-008** | Statistical | Tracer zero-count probability on small workloads | Binomial formula $P(0) = 0.95^N$ for $N \in [10, 50, 100]$ | $N=10 \to 59.9\%$, $N=50 \to 7.7\%$, $N=100 \to 0.6\%$ | Theoretical matches Monte Carlo (10k trials) | **PASS** | [`workload_test.go:145-175`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/workload_test.go#L145-L175) | Confirms zero-tracer loophole |
| **BF-T2-009** | Metric | Percentile calculation consistency across algorithms | $N=100$ uniform distribution (1..100) | P50=50, P90=90, P99=99 across all methods | Bot-Worker: 50/90/99; Telemetry: 50/90/99; NIST: 50.5/90.1/99.0 | **PASS** | [`metrics_test.go:90-112`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/metrics_test.go#L90-L112) | 1ms histogram resolution |
| **BF-T2-010** | Metric | 5000ms failure penalty impact on percentiles | 1000 requests with 0%, 1%, 2%, 10% failures | $\ge 2\%$ failures must push P99 to 5000ms | Failures 0%: P99=10; 1%: P99=10; 2%: P99=5000 | **PASS** | [`metrics_test.go:115-150`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/metrics_test.go#L115-L150) | Validates survivorship bias policy |
| **BF-T2-011** | Metric | Cross-service latency unit discrepancy | Compare 15ms latency in bot-worker vs telemetry | Both views must report identical units (ms) | Bot-worker: 15.0 ms; Telemetry/Replay: 15,000,000 ns | **FAIL (Defect)** | [`metrics_test.go:152-178`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/metrics_test.go#L152-L178) | 1,000,000x unit discrepancy |
| **BF-T2-012** | Accounting | Duration integer truncation in leaderboard TPS | Duration = 0.8s and 1.9s with 500 requests | True TPS: 625.0 and 263.16 | DB TPS: 0.0 (sub-sec) and 500.0 (+90% inflation) | **FAIL (Defect)** | [`metrics_test.go:180-230`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/metrics_test.go#L180-L230) | Truncates to integer seconds |
| **BF-T2-013** | Scoring | Scoring monotonicity under valid parameters | Vary TPS (1k..2k), P99 (15..50), Correctness (100..80) | Higher TPS $\uparrow$, Higher P99 $\downarrow$, Higher Correctness $\uparrow$ | All monotonic assertions passed strictly | **PASS** | [`scoring_test.go:35-85`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/scoring_test.go#L35-L85) | Well-formed data only |
| **BF-T2-014** | Adversarial | Leaderboard ranking integrity with cheater engines | 7 synthetic engines evaluated through production scoring | Legitimate correct engine must rank #1 | Cheater engine `E3_Cheater_200OK` ranks #1 (Score: 14,885.53 vs 1,915.69) | **FAIL (Defect)** | [`scoring_test.go:100-200`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/scoring_test.go#L100-L200) | Confirms cheater ranking exploit |
| **BF-T2-015** | Replay | Replay window query TPS derivation accuracy | 1000 requests over 10s (actual TPS=100) and 0.5s (actual TPS=2000) | Replay bucket TPS should equal count / duration | Replay reports hardcoded `count * 2 = 100` regardless of duration | **FAIL (Defect)** | [`replay_test.go:95-165`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/replay_test.go#L95-L165) | Hardcoded `count * 2` confirmed |
| **BF-T2-016** | Replay | Replay lifecycle stage timestamps fidelity | Replay generation with `StartedAt = "2026-10-17T10:00:00Z"` | Each phase (BUILD, DEPLOY, VALIDATION) has distinct timestamps | All 4 phases stamped with identical `StartedAt` | **FAIL (Defect)** | [`replay_test.go:167-180`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/replay_test.go#L167-L180) | Fabricated timestamps confirmed |

---

## 4. Blocked Tests & Operational Limitations

| Test Area | Reason Blocked / Unverified | Remediation Required Before Execution |
|---|---|---|
| **Multi-Service Docker Compose Live Run** | Blocked by BF-P1-022 (`FROM golang:1.26-alpine`), BF-P1-023 (missing migration runner), BF-P1-010 (mock-exchange compilation error), BF-P1-011 (submission-service syntax errors). | Fix Dockerfiles to stable Go, compile mock-exchange and submission-service, add DB migration bootstrapping container. |
| **Live Ingestion Saturation (15k TPS)** | Blocked because database is not running in live environment and unbatched inserts require dedicated DB instance. | Spin up dedicated PostgreSQL and run standalone `consumer.go` benchmark tool. |
| **Full End-to-End Submission ZIP Build** | Blocked because `docker-compose up` cannot build containers in untrusted test environment. | Build container runner in isolated VM without host docker socket access. |
