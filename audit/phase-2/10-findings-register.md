# BenchForge Phase 2 Audit — Findings Register

**Formal Defect Register: Correctness, Integrity, and Scoring Audit**

---

## Severity Scale
- 🔴 **CRITICAL**: Fundamentally invalidates benchmark results, allows fraudulent engines to dominate the leaderboard, or compromises system integrity.
- 🟠 **HIGH**: Major calculation distortion, significant measurement defect, or unhandled operational failure.
- 🟡 **MEDIUM**: Meaningful validation gap, omission in assertions, or architectural anti-pattern.
- 🟢 **LOW**: Minor code hygiene or precision issue with low operational impact.

---

## BF-P2-001 — Load Test Correctness Validation Is a Stub & Grants Cheaters 100% Fallback

- **Title:** Load Test Correctness Validation Is a Stub with Exploitable Leaderboard Fallback
- **Category:** Correctness / Benchmark Integrity / Leaderboard Gaming
- **Severity:** 🔴 CRITICAL
- **Confidence:** CONFIRMED
- **Status:** Open
- **Blocks Trust in Results:** **YES**
- **Follow-up Phase:** Phase 3 (Fix before proceeding to Performance Testing)
- **Source Location:**
  - `services/bot-worker/internal/workers/pool.go:210-218`
  - `services/benchmark-service/internal/repository/leaderboard.go:111-115`
  - `services/benchmark-service/internal/handlers/benchmarks.go:311-328`
- **Evidence:**
  ```go
  // pool.go:212
  func checkCorrectnessStub(resp *http.Response) bool {
      return resp.StatusCode >= 200 && resp.StatusCode < 300
  }

  // leaderboard.go:111
  cScore := computedSuccessRate
  if correctnessScore.Valid {
      cScore = correctnessScore.Float64
  }
  ```
- **Reproduction Steps:**
  1. Submit a dummy engine that returns `200 OK` with `{"status":"ok"}`.
  2. Scenario pre-validation returns `CONTRACT_NOT_SUPPORTED`. `correctness_score` in `submissions` is left `NULL`.
  3. Load test runs 1,000 requests. `checkCorrectnessStub` marks 100% of requests as `success=true`.
  4. Leaderboard upsert executes. `correctnessScore.Valid` is false, so it falls back to `computedSuccessRate` (100.0%).
  5. The cheater engine receives a score of **14,885.53**, taking Rank #1 over legitimate engines (Score: 1,915.69).
- **Expected Behavior:** Responses during load testing must be validated for trade receipts and valid execution status. If scenario validation fails or returns unsupported format, the benchmark must either abort or record `correctness_score = 0.0`.
- **Actual Behavior:** Any HTTP 200 response is counted as a successful operation, and failed scenarios fall back to 100% correctness.
- **Impact:** Fraudulent engines score 7.7x higher than real matching engines.
- **Recommended Action:** Replace `checkCorrectnessStub` with response payload validation. Remove the fallback to `computedSuccessRate` in `leaderboard.go`.

---

## BF-P2-002 — Static Pre-Validation Scenarios Enable Canned Response Fraud

- **Title:** Static Hardcoded Scenarios Enable Full Score via Canned Receipts
- **Category:** Benchmark Integrity / Adversarial Robustness
- **Severity:** 🔴 CRITICAL
- **Confidence:** CONFIRMED
- **Status:** Open
- **Blocks Trust in Results:** **YES**
- **Follow-up Phase:** Phase 3
- **Source Location:**
  - `services/benchmark-service/internal/handlers/benchmarks.go:180-258`
  - `services/bot-worker/internal/workers/pool.go:190-208`
- **Evidence:**
  The 6 pre-validation scenarios in `benchmarks.go` hardcode exact prices, quantities, and symbols:
  - `basic_resting_order`: BUY 100 AAPL @ $150
  - `basic_matching_order`: BUY 50 MSFT $\to$ SELL 50 MSFT
  - `partial_fill_order`: BUY 100 AMZN $\to$ 2x SELL 50
  - `price_improvement`: BUY 10 TSLA @ 100 $\to$ SELL @ 90
  - `fifo_priority`: BUY 10 GOOG, BUY 20 GOOG $\to$ SELL 15
  - `multi_level_price_sweep`: SELL 10, 10, 10 NVDA @ 100, 101, 102 $\to$ BUY 25 @ 105
- **Reproduction Steps:**
  1. Build an engine that inspects the incoming order's `symbol` and `quantity`.
  2. If `symbol == "AAPL"`, return hardcoded receipt for Step 1.
  3. If `symbol == "MSFT"`, return hardcoded trade for Step 2.
  4. Run `oracle_test.go:TestBenchForge_AdversarialEngines/Canned_Response_Passes_Validation`.
  5. Test outputs: `Passed=true, Status="PASSED"`.
- **Expected Behavior:** Scenarios should generate dynamic, randomized symbols, quantities, and prices per benchmark session to prevent pre-computed receipt replays.
- **Actual Behavior:** Scenarios are 100% deterministic and static across all runs.
- **Impact:** An engine with zero matching logic passes pre-validation with 100% correctness.
- **Recommended Action:** Parameterize scenario generators with randomized order IDs, symbols, quantities, and price offsets seeded per benchmark.

---

## BF-P2-003 — 1,000,000x Latency Unit Discrepancy Across Services

- **Title:** Microservice Latency Unit Mismatch (Milliseconds vs Nanoseconds)
- **Category:** Metrics Correctness / Cross-Service Consistency
- **Severity:** 🔴 CRITICAL
- **Confidence:** CONFIRMED
- **Status:** Open
- **Blocks Trust in Results:** **YES**
- **Follow-up Phase:** Phase 3
- **Source Location:**
  - `services/bot-worker/internal/workers/pool.go:126,168`
  - `services/telemetry-service/internal/consumer/consumer.go:32`
  - `services/telemetry-service/internal/aggregator/replay_worker.go:87-89`
  - `services/bot-worker/cmd/worker/main.go:295`
- **Evidence:**
  `bot-worker` pool serializes `time.Duration` (nanoseconds) to Redis: `{"latency": 15000000}`.
  `telemetry-service` stores `15000000` into PostgreSQL `telemetry_metrics.latency`.
  `replay_worker.go` calculates `PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency)` yielding `15000000 ns`.
  `bot-worker` `main.go:295` converts to milliseconds: `result.Latency.Seconds() * 1000 = 15.0 ms`.
- **Impact:** Replay and WebSocket dashboards display latency in nanoseconds (1,000,000x higher than summary). If nanoseconds were fed into the leaderboard formula, final scores would be destroyed by 99.998%.
- **Recommended Action:** Standardize on milliseconds (or microseconds) across all services at the point of metric creation. Divide `time.Duration` by `1e6` before sending to Redis Streams.

---

## BF-P2-004 — Integer Truncation of Benchmark Duration Distorts Throughput

- **Title:** Integer Duration Truncation Causes Zero TPS or Massive Inflation
- **Category:** Metrics Correctness / Scoring Integrity
- **Severity:** 🟠 HIGH
- **Confidence:** CONFIRMED
- **Status:** Open
- **Blocks Trust in Results:** **YES**
- **Follow-up Phase:** Phase 3
- **Source Location:**
  - `services/benchmark-service/internal/repository/leaderboard.go:97-105`
  - `services/benchmark-service/migrations/001_create_benchmarks_table.sql`
- **Evidence:**
  `leaderboard.go:99`: `dur := int(duration.Int64)` reads an `INTEGER` column.
  If duration is 0.8s, `dur = 0` $\to$ `computedTps = 0.0`.
  If duration is 1.9s, `dur = 1` $\to$ `computedTps = 500 / 1 = 500` (actual: 263.16 req/s).
- **Reproduction Steps:**
  Execute `metrics_test.go:TestMetrics_ThroughputAccountingEdgeCases`. Output shows 0.0 TPS for 800ms run and +90% inflation for 1.9s run.
- **Expected Behavior:** Duration should be a floating-point numeric value (`NUMERIC(10, 4)`), preserving millisecond precision.
- **Actual Behavior:** Duration is truncated to integer seconds.
- **Impact:** Sub-second benchmarks fail to score; fractional benchmarks receive up to 90% artificial score inflation.
- **Recommended Action:** Change `duration_seconds` to `NUMERIC(10, 4)` in database migrations and use `float64` in `leaderboard.go`.

---

## BF-P2-005 — Replay Bucket TPS Is Hardcoded as `count * 2`

- **Title:** Replay Engine Falsifies Bucket Throughput Using Hardcoded Multiplication
- **Category:** Replay Integrity / Observability
- **Severity:** 🟠 HIGH
- **Confidence:** CONFIRMED
- **Status:** Open
- **Blocks Trust in Results:** **YES**
- **Follow-up Phase:** Phase 3
- **Source Location:**
  - `services/telemetry-service/internal/aggregator/replay_worker.go:126`
- **Evidence:**
  ```go
  tps := count * 2 // simplified TPS derivation
  ```
- **Reproduction Steps:**
  Execute `replay_test.go:TestReplay_HardcodedTPSFalsification`.
  - For a 2,000 TPS run: Replay displays 100 TPS (20.4x under-reported).
  - For a 20 TPS run: Replay displays 100 TPS (4.9x over-reported).
- **Expected Behavior:** Bucket TPS should be calculated from the timestamps of events within the bucket: `float64(count) / bucketDuration.Seconds()`.
- **Actual Behavior:** TPS is unconditionally set to $2 \times \text{bucket count}$.
- **Impact:** The Replay Engine displays completely false throughput telemetry.
- **Recommended Action:** Calculate bucket duration from `max(created_at) - min(created_at)` and compute real TPS.

---

## BF-P2-006 — Replay Lifecycle Timestamps Are Fabricated Duplicates

- **Title:** All Replay Lifecycle Phases Share Identical Timestamp
- **Category:** UI Fidelity / Replay Integrity
- **Severity:** 🟠 HIGH
- **Confidence:** CONFIRMED
- **Status:** Open
- **Blocks Trust in Results:** NO (Cosmetic / UI timeline only)
- **Follow-up Phase:** Phase 3
- **Source Location:**
  - `services/telemetry-service/internal/aggregator/replay_worker.go:267-276`
- **Evidence:**
  `BUILD`, `DEPLOY`, `VALIDATION`, and `BENCHMARK` events are all appended with `Timestamp: bmData.StartedAt`.
- **Expected Behavior:** Each phase should record its actual start and end timestamps from pipeline logs.
- **Actual Behavior:** All phases show simultaneous 0-second execution at `StartedAt`.
- **Impact:** The lifecycle timeline on the Replay dashboard is fabricated.
- **Recommended Action:** Query `submission_logs` for actual stage transition timestamps.

---

## BF-P2-007 — Zero-Tracer Workloads Default to 100% Concurrency Score

- **Title:** Short Benchmarks with Zero Tracers Receive Default 100% Concurrency
- **Category:** Scoring Integrity / Statistical Validity
- **Severity:** 🟠 HIGH
- **Confidence:** CONFIRMED
- **Status:** Open
- **Blocks Trust in Results:** **YES**
- **Follow-up Phase:** Phase 3
- **Source Location:**
  - `services/benchmark-service/internal/repository/leaderboard.go:118-121`
  - `services/bot-worker/internal/workers/pool.go:83-89`
- **Evidence:**
  ```go
  concurrencyScore := 100.0 // Default to 100 if no tracers ran
  if tracerTotal.Valid && tracerTotal.Int64 > 0 {
      concurrencyScore = (float64(tracerSuccess.Int64) / float64(tracerTotal.Int64)) * 100.0
  }
  ```
- **Reproduction Steps:**
  Run `workload_test.go:TestWorkload_TracerProbabilityAndZeroOccurrence`. For $N=50$, $7.7\%$ of runs have 0 tracers; for $N=10$, $59.9\%$ have 0 tracers.
- **Expected Behavior:** A minimum number of tracers must be mandated (or a separate dedicated tracer stream run) before awarding a concurrency score.
- **Actual Behavior:** 0 tracers results in an automatic 100% score.
- **Impact:** Short benchmarks game concurrency without running any concurrent safety tests.
- **Recommended Action:** Run a mandatory deterministic tracer burst (e.g., minimum 20 tracer pairs) regardless of total request count.

---

## BF-P2-008 — Workload Generator Omits Cancellations and Market Orders

- **Title:** Bot Workload Generator Never Emits Cancel or Market Orders
- **Category:** Workload Execution / Contract Completeness
- **Severity:** 🟠 HIGH
- **Confidence:** CONFIRMED
- **Status:** Open
- **Blocks Trust in Results:** **YES**
- **Follow-up Phase:** Phase 3
- **Source Location:**
  - `services/bot-worker/internal/bots/bots.go:34-135`
- **Evidence:**
  `Order` struct only contains `Symbol`, `Price`, `Quantity`, `Side`. Every single persona submits limit orders with numeric prices. No cancellation requests or endpoints exist.
- **Expected Behavior:** A trading benchmark should test order cancellations (book purging, FIFO preservation after cancels) and market orders.
- **Actual Behavior:** Trading engines are only evaluated on resting and matching limit orders.
- **Impact:** An engine that has severe memory leaks on cancellations or broken cancellation locking is never exposed.
- **Recommended Action:** Add a cancellation action to `Order` and introduce cancel personas in `bots.go`.

---

## BF-P2-009 — Scenario Runner Never Asserts `executed_quantity`

- **Title:** `RunScenario` Parses But Does Not Validate `executed_quantity`
- **Category:** Test Assertions / Correctness Gap
- **Severity:** 🟡 MEDIUM
- **Confidence:** CONFIRMED
- **Status:** Open
- **Blocks Trust in Results:** NO
- **Follow-up Phase:** Phase 3
- **Source Location:**
  - `services/bot-worker/internal/scenario/executor.go:80-113`
- **Evidence:**
  `OrderResponse.ExecutedQuantity` is parsed from JSON on line 23, but lines 88-112 only assert `Status`, `len(Trades)`, and trade `Price`/`Quantity`. `orderResp.ExecutedQuantity` is never checked.
- **Expected Behavior:** `if orderResp.ExecutedQuantity != step.ExpectedExecutedQuantity { return FAILED }`.
- **Actual Behavior:** An engine returning `executed_quantity: 999999` with correct trade receipts passes without error.
- **Recommended Action:** Add explicit assertion for `orderResp.ExecutedQuantity`.

---

## BF-P2-010 — Global Random State Advanced Disregarding Local RNG

- **Title:** Persona Generator Unconditionally Calls Global Rand
- **Category:** Code Hygiene / Thread Contention
- **Severity:** 🟢 LOW
- **Confidence:** CONFIRMED
- **Status:** Open
- **Blocks Trust in Results:** NO
- **Follow-up Phase:** Phase 3
- **Source Location:**
  - `services/bot-worker/internal/bots/bots.go:50-135`
- **Evidence:**
  `randomSide()` and persona generators call `rand.Float32()` / `rand.Float64()` on the global generator before checking if `rng != nil`.
- **Recommended Action:** Guard global `rand` calls with `if rng == nil`.
