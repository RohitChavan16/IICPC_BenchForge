# BenchForge Phase 2 Audit — Executive Summary: Correctness, Benchmark Integrity, and Scoring

**Audit Date:** 2026-10-17  
**Auditor:** Senior Performance Benchmarking & Distributed Systems Auditor  
**Repository:** `e:\AIML_Projects\iicpc_benchforge`  
**Baseline:** Untagged HEAD (evaluated with Go 1.26.3 on Windows host)  
**Artifact Directory:** `audit/phase-2/`  

---

## 1. Central Audit Verdict

### Central Question:
> **Can BenchForge reliably distinguish a correct, performant trading engine from an incorrect, slow, unstable, or deliberately misleading one?**

### Definitive Answer: **NO**

Based on rigorous source inspection, independently derived mathematical oracles, deterministic scenario tests, and reproducible adversarial simulations, **BenchForge cannot currently distinguish a correct trading engine from an incorrect or deliberately gaming one.** 

In multiple proven scenarios, an engine that **executes zero trades**, **drops orders**, or **returns canned dummy responses** will not only pass BenchForge's evaluation but will **dominate the leaderboard**, beating a 100% correct matching engine by up to **777% in final score**.

---

## 2. Executive Key Findings

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BENCHFORGE VERDICT                                   │
│  Leaderboard Trustworthiness: FAILED (Cannot be trusted in current state)             │
│  Submission Correctness Validation: PARTIALLY VERIFIED (Only in static pre-validation) │
│  Load Test Correctness Validation: FAILED (200 OK stub accepts empty / invalid JSON)   │
│  Metric Calculations: FAILED (1,000,000x latency unit mismatch between services)       │
│  Replay Engine Fidelity: FAILED (Hardcoded count*2 TPS, fabricated timestamps)        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### The Three Critical Gaming & Correctness Exploits
1. **The 200-OK Cheater Exploit (BF-P2-001 / BF-P1-001):**
   During the 100-goroutine load test (which generates 95% of all traffic), `pool.go:212` uses `checkCorrectnessStub`, which marks any HTTP 2xx response as `success = true`. If an engine returns legacy/empty JSON during pre-validation, `submissions.correctness_score` remains `NULL`, causing `leaderboard.go:112` to **fall back to `computedSuccessRate` (100%)** as its correctness score. In our deterministic benchmark simulation, an engine returning dummy 200 OK responses scored **14,885.53**, beating a legitimate high-performance matching engine (**1,915.69**) by **7.7x**.
2. **The Canned Scenarios Exploit (BF-P2-002):**
   The 6 correctness pre-validation scenarios in `benchmarks.go` and the Tracer scenario in `pool.go` use **completely static, hardcoded order parameters** (fixed symbols, quantities, and prices). A malicious submission with no matching engine whatsoever can pattern-match incoming orders and return hardcoded JSON receipts, achieving a **100% correctness score** and **100% tracer concurrency score**.
3. **The 1,000,000x Latency Unit Discrepancy (BF-P2-003):**
   `bot-worker` measures latency in `time.Duration` (nanoseconds) and serializes it as an integer nanosecond count to Redis Streams. `telemetry-service` ingests this raw integer directly into PostgreSQL `telemetry_metrics (latency)` and its in-memory live broadcast aggregator. Consequently, the live WebSocket dashboard and the 20-bucket Replay engine calculate percentiles in **nanoseconds** (e.g., 15,000,000 ns for 15ms), while the `benchmarks` summary table and Leaderboard scoring formula calculate percentiles in **milliseconds** (15.0 ms).

---

## 3. Core Verified Strengths

Despite critical correctness and gaming defects, the audit confirmed several foundational engineering strengths:

| Component | Verified Behavior | Evidence |
|---|---|---|
| **Scenario Assertion Logic** | `executor.go:RunScenario` rigorously validates order status, trade count, prices, quantities, and Maker Order ID linkage when testing compliant engines. | [`executor_test.go:43-202`](file:///e:/AIML_Projects/iicpc_benchforge/services/bot-worker/internal/scenario/executor_test.go#L43-L202) |
| **Price-Time Priority Detection** | The scenario runner accurately detects and fails engines that invert FIFO order priority or execute trades at taker price instead of maker price. | [`oracle_test.go:435-455`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/oracle_test.go#L435-L455) |
| **Deterministic Persona Generator** | `GenerateDeterministicPersonaMix` produces an exact, reproducible 60/20/10/5/5 distribution mix across runs when given an identical non-zero seed. | [`workload_test.go:30-85`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/workload_test.go#L30-L85) |
| **Concurrent Workload Routing** | `atomic.AddInt64(&GlobalPersonaIdx, 1)` provides thread-safe, lockless distribution of pre-shuffled personas across 100 worker goroutines without item loss. | [`workload_test.go:88-140`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/workload_test.go#L88-L140) |
| **5000ms Failure Penalty Policy** | The failure penalty design successfully forces P99 to 5000ms whenever request failure rates reach $\ge 2\%$, preventing survivorship bias for crashing engines. | [`metrics_test.go:115-150`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/metrics_test.go#L115-L150) |
| **Monotonic Scoring Properties** | For valid, comparable engines, the scoring formula is mathematically monotonic with respect to valid TPS, P99 latency, and correctness. | [`scoring_test.go:34-75`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/scoring_test.go#L34-L75) |

---

## 4. Confirmed Phase 2 Defects

| Finding ID | Severity | Category | Description |
|---|---|---|---|
| **BF-P2-001** | 🔴 CRITICAL | Correctness / Gaming | Load test correctness validation is a stub (`checkCorrectnessStub`); combined with legacy fallback in `leaderboard.go:112`, dummy 200 OK engines receive 100% correctness. |
| **BF-P2-002** | 🔴 CRITICAL | Correctness / Gaming | Correctness scenarios and Tracer orders are completely deterministic and static; engines with no order book can return canned receipts and pass 100%. |
| **BF-P2-003** | 🔴 CRITICAL | Metrics Discrepancy | 1,000,000x latency unit mismatch: `telemetry-service` and Replay use nanoseconds; `bot-worker` and Leaderboard use milliseconds. |
| **BF-P2-004** | 🟠 HIGH | Scoring / Accounting | Integer truncation of `duration_seconds`: benchmarks running under 1.0s score 0.0 TPS; benchmarks running 1.9s receive a 90% TPS inflation. |
| **BF-P2-005** | 🟠 HIGH | Replay Integrity | Replay TPS is hardcoded as `count * 2` (`replay_worker.go:126`), leading to up to 20x under- or over-reporting of actual throughput. |
| **BF-P2-006** | 🟠 HIGH | UI / Replay Integrity | Replay lifecycle timestamps for BUILD, DEPLOY, VALIDATION, and BENCHMARK are fabricated duplicates of `StartedAt`. |
| **BF-P2-007** | 🟠 HIGH | Scoring Integrity | When `tracerTotal == 0` (which occurs in ~8% of 50-request runs and 60% of 10-request runs), concurrency score defaults to 100.0%, inflating scores. |
| **BF-P2-008** | 🟠 HIGH | Workload Validity | No order cancellation or market order support: bot personas only generate limit orders; trading engine cancellation logic is completely untested. |
| **BF-P2-009** | 🟡 MEDIUM | Correctness Assertion Gap | `executor.go:RunScenario` parses `executed_quantity` from engine responses but never asserts that it matches expected execution quantity. |
| **BF-P2-010** | 🟡 MEDIUM | Workload Generation | `bots.go` unnecessarily calls global `rand.Float32()` / `rand.Float64()` even when local `rng` is provided, advancing global state. |

---

## 5. Direct Answers to Phase 2 Mandated Questions

| # | Question | Status | Concise Justification & Evidence |
|---|---|---|---|
| **1** | Does the benchmark execute the intended workload? | **Partially verified** | The 5 persona distributions and request counts execute deterministically via `pool.go`, but only limit orders are generated. Market orders, cancellations, and complex order types are absent. |
| **2** | Are attempted, successful, failed, and incorrect operations distinguished correctly? | **Failed** | HTTP 200 responses are treated as correct operations by `checkCorrectnessStub` during load testing. Incorrect trading outputs returning 200 OK are counted as successful. |
| **3** | Are throughput and latency metrics calculated according to defensible definitions? | **Failed** | Leaderboard TPS truncates duration to integer seconds ($<1.0\text{s} \to 0\text{ TPS}$, $1.9\text{s} \to 90\%$ inflation). Latency in telemetry/replay is in nanoseconds, while leaderboard uses milliseconds. |
| **4** | Can an incorrect engine obtain a high score? | **Failed** | **Yes.** A cheating engine returning empty 200 OK responses or canned scenario JSON achieves Rank #1 with a score of 14,885.53 vs 1,915.69 for a correct engine. |
| **5** | Does the scoring formula behave as intended across edge cases? | **Partially verified** | Formula is monotonic for well-formed data, but fails on sub-second runs (score=0), zero tracers (defaults to 100 concurrency), and legacy fallback (gives 100% correctness). |
| **6** | Does the leaderboard contain only eligible and comparable results? | **Failed** | Leaderboard upsert allows legacy engines (`CONTRACT_NOT_SUPPORTED`) to qualify with fallback 100% correctness. Mock target runs are excluded, but deployment comparisons are corrupted by cheaters. |
| **7** | Does replay accurately represent the stored execution history according to its intended contract? | **Failed** | Replay displays fabricated lifecycle timestamps (all equal to `StartedAt`) and calculates bucket TPS via hardcoded `count * 2` rather than actual elapsed time. |
| **8** | Which confirmed defects invalidate existing benchmark results? | **Confirmed** | BF-P2-001 (load correctness stub), BF-P2-003 (latency unit mismatch), BF-P2-004 (duration integer truncation), and BF-P2-005 (replay TPS falsification). |
| **9** | Which claims remain unverified? | **Unverified** | Claimed 10,000–20,000 TPS under full production load; Redis Streams ingestion throughput at 15,000 metrics/sec with unbatched SQL inserts; container isolation with no external egress. |
| **10** | Is the platform sufficiently trustworthy to proceed to performance evaluation? | **Failed** | **No.** Correctness defects BF-P2-001, BF-P2-002, BF-P2-003, and BF-P2-004 must be resolved before any performance benchmark or leaderboard ranking can be trusted. |

---

## 6. Audit Roadmap Navigation

The findings summarized above are substantiated across the subsequent Phase 2 reports:

- [**02-benchmark-lifecycle-correctness.md**](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/02-benchmark-lifecycle-correctness.md): Full state machine lifecycle trace, transitions, preconditions, and failure modes.
- [**03-trading-engine-correctness.md**](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/03-trading-engine-correctness.md): Independent Price-Time Priority Oracle, invariants, adversarial engine test suite.
- [**04-workload-execution-audit.md**](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/04-workload-execution-audit.md): Deterministic persona generation, concurrency, tracer probability, accounting gaps.
- [**05-metrics-validation.md**](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/05-metrics-validation.md): In-depth validation of TPS, P50/P90/P99, latency unit mismatch, and error accounting.
- [**06-scoring-and-ranking-audit.md**](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/06-scoring-and-ranking-audit.md): Production scoring formula disassembly, mathematical properties, and leaderboard gaming exploits.
- [**07-replay-and-telemetry-integrity.md**](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/07-replay-and-telemetry-integrity.md): Replay window functions, hardcoded TPS falsification, and timestamp fabrication.
- [**08-persistence-integrity.md**](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/08-persistence-integrity.md): Cross-service database integrity, multi-service writes, and schema precision.
- [**09-test-matrix-and-results.md**](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/09-test-matrix-and-results.md): Traceable test catalog, inputs, outputs, commands, and pass/fail evidence.
- [**10-findings-register.md**](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/10-findings-register.md): Comprehensive register of all Phase 2 findings (BF-P2-001 through BF-P2-010).
- [**11-phase-3-handoff.md**](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/11-phase-3-handoff.md): High-risk areas for Phase 3 (Concurrency, Contention, Scalability, and Host Security).
