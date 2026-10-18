# BenchForge Phase 2 Audit — Scoring Formula and Ranking Integrity

**Workstream E: Scoring Semantics, Mathematical Properties, Adversarial Ranking, and Exploits**

---

## 1. Production Scoring Formula Disassembly

Inspection of `services/benchmark-service/internal/repository/leaderboard.go:158-179` establishes the exact mathematical formula executed by the BenchForge production pipeline:

```go
func computeFinalScore(tps, successRate, p50, p99, correctnessScore, concurrencyScore float64) float64 {
	if correctnessScore < 0 {
		correctnessScore = 0
	}
	if concurrencyScore < 0 {
		concurrencyScore = 0
	}
	
	effectiveTps := tps * (successRate / 100.0)
	latencyFactor := 250.0 / (250.0 + p99)
	correctnessMultiplier := math.Pow(correctnessScore/100.0, 2)
	
	tracerScore := concurrencyScore
	ratio := p99 / math.Max(p50, 1.0)
	degradationScore := 100.0 / (1.0 + math.Pow(ratio/20.0, 2))
	
	combinedConcurrencyScore := (0.85 * tracerScore) + (0.15 * degradationScore)
	concurrencyMultiplier := math.Pow(combinedConcurrencyScore/100.0, 2)
	
	finalScore := effectiveTps * latencyFactor * correctnessMultiplier * concurrencyMultiplier
	return math.Round(finalScore*100) / 100
}
```

### Full Mathematical Formula:
$$\text{FinalScore} = \text{EffectiveTPS} \times \text{LatencyFactor} \times \left(\frac{\text{CorrectnessScore}}{100}\right)^2 \times \left(\frac{\text{CombinedConcurrency}}{100}\right)^2$$

Where:
1. $$\text{EffectiveTPS} = \text{TPS} \times \frac{\text{SuccessRate}}{100}$$
2. $$\text{LatencyFactor} = \frac{250}{250 + \text{P99}_{\text{ms}}}$$
3. $$\text{Ratio} = \frac{\text{P99}_{\text{ms}}}{\max(\text{P50}_{\text{ms}}, 1.0)}$$
4. $$\text{DegradationScore} = \frac{100}{1 + \left(\frac{\text{Ratio}}{20}\right)^2}$$
5. $$\text{CombinedConcurrency} = 0.85 \times \text{ConcurrencyScore} + 0.15 \times \text{DegradationScore}$$

---

## 2. Contradictions Between Documentation and Code

| Source | Documented Formula | Discrepancy with Actual Code |
|---|---|---|
| **`docs/benchmark_methodology.md:60`** | $\text{Final Score} = (\text{Effective TPS} \times 10) - (\text{P99 Latency} \times 0.5)$ | **COMPLETE CONTRADICTION.** The linear subtraction model documented in the methodology is completely absent from the code. |
| **`README.md`** | $\text{TPS} \times \frac{\text{SuccessRate}}{100} \times \frac{250}{250+\text{P99}} \times \left(\frac{\text{Correctness}}{100}\right)^2 \times \left(\frac{\text{Concurrency}}{100}\right)^2$ | **OMISSION.** Does not document the tail-latency degradation score ($\text{Ratio} = \text{P99}/\text{P50}$) blended at 15% into concurrency. |
| **`leaderboard.go` (Actual Code)** | Blends Tracer Pass Rate ($85\%$) with Tail Degradation Curve ($15\%$) | **Actual Production Truth.** |

---

## 3. Mathematical Properties & Monotonicity (E2)

Verified empirically in [`scoring_test.go:TestScoring_MathematicalProperties`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/scoring_test.go#L35-L95):

1. **TPS Monotonicity:** Strictly increasing. Doubling TPS from 1,000 to 2,000 doubles the final score ($937.18 \to 1,874.36$).
2. **P99 Latency Damping:** Strictly decreasing. Increasing P99 from 15ms to 50ms reduces score from $937.18$ to $815.22$. At P99 = 250ms, score drops by 50%. At P99 = 5000ms (failure penalty), score drops by 95.2%.
3. **Correctness Super-Linearity:** Scaled quadratically ($\text{Correctness}^2$). An engine with 80% correctness retains only $64\%$ of its score ($937.18 \to 599.80$). At 0% correctness, score is strictly **0.00**.
4. **Tail Degradation Curve:** When P99 exceeds P50 by more than 20x ($\text{Ratio} > 20$), `degradationScore` drops below 50. Because it is weighted at 15% in `combinedConcurrencyScore`, severe tail degradation imposes up to a $27.7\%$ penalty on the final score even if 100% of tracer orders match.
5. **Zero Concurrency Boundary:** If `tracerScore = 0`, the engine does **not** receive a zero concurrency score. It still receives $0.15 \times \text{degradationScore}$. With $\text{Ratio} = 3$, `degradationScore = 97.8`, yielding `combinedConcurrency = 14.67` and a score of **20.30** instead of 0.00.

---

## 4. Adversarial Ranking Tests & Leaderboard Inversion (E3)

To test whether BenchForge can protect the leaderboard from cheating or incorrect engines, 7 synthetic engine profiles were simulated through the exact production scoring pipeline in [`scoring_test.go:TestScoring_SyntheticEngineLeaderboardRankings`](file:///e:/AIML_Projects/iicpc_benchforge/audit/phase-2/tests/scoring_test.go#L100-L200):

### Simulated Leaderboard Table

| Rank | Engine Profile Name | Final Score | TPS | P99 (ms) | Correct% | Concurrency% | Classification & Outcome |
|:---:|---|:---:|:---:|:---:|:---:|:---:|---|
| 🥇 **#1** | **`E3_Cheater_200OK_Stub`** | **14,885.53** | 15,000 | 1.5 | 100.0% | 100.0% | 🚨 **CHEATER WINS (+777% over valid engine)** |
| 🥈 **#2** | **`E4_Cheater_Canned_Scenarios`**| **9,891.19** | 10,000 | 2.0 | 100.0% | 100.0% | 🚨 **CHEATER RUNNER-UP (+516% over valid engine)** |
| 🥉 **#3** | **`E1_Correct_Fast`** | **1,915.69** | 2,000 | 8.0 | 100.0% | 100.0% | ✅ **Legitimate High-Performance Engine** |
| **#4** | `E7_High_Tail_Degradation` | **523.10** | 1,000 | 100.0 | 100.0% | 100.0% | Valid engine with lock contention |
| **#5** | `E6_Partially_Correct` | **395.96** | 1,000 | 15.0 | 65.0% | 100.0% | Fails price sweep and FIFO |
| **#6** | `E2_Correct_Slow` | **165.90** | 200 | 50.0 | 100.0% | 100.0% | Correct reference implementation |
| **#7** | `E5_Fast_Flaky_2PercentDrops` | **152.15** | 5,000 | 5,000.0 | 100.0% | 95.0% | Penalized by 5000ms latency penalty |

---

## 5. Verified Gaming Vectors & Exploit Mechanics

### Exploit 1: The 200 OK Cheater Loophole
- **Mechanism:** The contestant submits a Go web server that implements:
  ```go
  func handleOrder(w http.ResponseWriter, r *http.Request) {
      w.WriteHeader(http.StatusOK)
      w.Write([]byte(`{"status":"ok"}`))
  }
  ```
- **Pre-Validation:** Scenario runner returns `CONTRACT_NOT_SUPPORTED`. `submissions.correctness_score` is left `NULL`.
- **Load Test:** `checkCorrectnessStub` returns `true` for all 15,000 requests. Success rate = 100%. Latency is sub-millisecond (no processing).
- **Leaderboard Upsert:** `leaderboard.go:112` executes:
  ```go
  cScore := computedSuccessRate
  if correctnessScore.Valid { cScore = correctnessScore.Float64 }
  ```
  Because `correctnessScore.Valid` is false, `cScore` is set to `100.0%`!
- **Result:** The cheating engine scores **14,885.53**, dominating the competition without matching a single order.

### Exploit 2: Canned Static Scenario Interception
- **Mechanism:** Because all 6 pre-validation scenarios and Tracer orders use hardcoded symbols (`AAPL`, `MSFT`, `TSLA`, `AMZN`, `GOOG`, `NVDA`, `TRC-xxxxxxxx`), a contestant can hardcode pattern matching in their HTTP handler to return exact pre-calculated matching receipts.
- **Result:** 100% scenario correctness and 100% tracer concurrency, followed by sub-millisecond dummy responses during load testing, producing a score of **9,891.19**.

### Exploit 3: Zero-Tracer Run Default Inflation (BF-P2-007)
- **Mechanism:** For short benchmarks ($N \le 50$), there is up to a 60% probability that zero tracers run.
- **Code:** `leaderboard.go:118`: `concurrencyScore := 100.0 // Default to 100 if no tracers ran`.
- **Result:** Contestants targeting small workload tests automatically receive a perfect concurrency score without concurrent verification.

### Exploit 4: Integer Duration Truncation Gaming (BF-P2-004)
- **Mechanism:** A contestant calibrates their engine throughput so that the benchmark finishes in 1.95 seconds.
- **Code:** `leaderboard.go:99`: `dur := int(duration.Int64)` truncates 1.95s to 1 second.
- **Result:** TPS is calculated as $\frac{N}{1}$ instead of $\frac{N}{1.95}$, yielding an artificial **95% throughput bonus**.

---

## 6. Leaderboard Database Integrity (E4)

Inspection of `leaderboard.go:126-194` confirms the leaderboard query logic:

```sql
INSERT INTO leaderboard_entries (...)
VALUES (...)
ON CONFLICT (normalized_team_name) DO UPDATE SET
  ...
WHERE EXCLUDED.final_score > leaderboard_entries.final_score;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    ORDER BY final_score DESC, success_rate DESC, p99 ASC, tps DESC, created_at ASC
  ) AS rank_value
  FROM leaderboard_entries
)
UPDATE leaderboard_entries SET rank = ranked.rank_value ...
```

### Verified Properties:
- **Personal Best Preservation:** `WHERE EXCLUDED.final_score > leaderboard_entries.final_score` ensures a team's lower score does not overwrite their personal best.
- **Deterministic Tie-Breaking:** `final_score DESC` $\to$ `success_rate DESC` $\to$ `p99 ASC` $\to$ `tps DESC` $\to$ `created_at ASC` provides complete, deterministic ordering for tied scores.
- **Rank Gaps:** Uses `ROW_NUMBER()`, ensuring ranks are contiguous ($1, 2, 3, \dots$) rather than skipping numbers on ties.

### Leaderboard Integrity Verdict:
While the SQL storage, upsert condition, and ranking tie-breakers are implemented correctly, the **inputs fed into the leaderboard are fundamentally vulnerable to gaming**. The leaderboard cannot be trusted until exploits 1, 2, 3, and 4 are patched.
