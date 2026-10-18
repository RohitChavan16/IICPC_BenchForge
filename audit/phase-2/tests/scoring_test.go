package main

import (
	"math"
	"sort"
	"testing"
)

// Replicate computeFinalScore from services/benchmark-service/internal/repository/leaderboard.go

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

type EngineProfile struct {
	Name             string
	TPS              float64
	SuccessRate      float64
	P50              float64
	P99              float64
	CorrectnessScore float64
	ConcurrencyScore float64
	Description      string
}

func TestScoring_MathematicalProperties(t *testing.T) {
	// Baseline engine
	baseTPS := 1000.0
	baseSuccess := 100.0
	baseP50 := 5.0
	baseP99 := 15.0
	baseCorrect := 100.0
	baseConcurr := 100.0

	baseScore := computeFinalScore(baseTPS, baseSuccess, baseP50, baseP99, baseCorrect, baseConcurr)
	t.Logf("Baseline Engine Score: %.2f", baseScore)

	// 1. Monotonicity of TPS: increasing TPS should strictly increase score
	highTPSScore := computeFinalScore(2000.0, baseSuccess, baseP50, baseP99, baseCorrect, baseConcurr)
	if highTPSScore <= baseScore {
		t.Errorf("TPS monotonicity failed: 2000 TPS score (%.2f) <= 1000 TPS score (%.2f)", highTPSScore, baseScore)
	}

	// 2. Monotonicity of P99 Latency: increasing P99 latency should strictly decrease score
	highP99Score := computeFinalScore(baseTPS, baseSuccess, baseP50, 50.0, baseCorrect, baseConcurr)
	if highP99Score >= baseScore {
		t.Errorf("P99 monotonicity failed: 50ms P99 score (%.2f) >= 15ms P99 score (%.2f)", highP99Score, baseScore)
	}

	// 3. Monotonicity of Correctness: lower correctness should strictly decrease score
	lowerCorrectScore := computeFinalScore(baseTPS, baseSuccess, baseP50, baseP99, 80.0, baseConcurr)
	if lowerCorrectScore >= baseScore {
		t.Errorf("Correctness monotonicity failed: 80%% score (%.2f) >= 100%% score (%.2f)", lowerCorrectScore, baseScore)
	}

	// 4. Zero Correctness: must yield 0 score
	zeroCorrectScore := computeFinalScore(baseTPS, baseSuccess, baseP50, baseP99, 0.0, baseConcurr)
	if zeroCorrectScore != 0.0 {
		t.Errorf("Zero correctness should yield 0.0, got %.2f", zeroCorrectScore)
	}

	// 5. Zero Concurrency (Tracer=0, Degradation=0): must yield 0 score
	zeroConcurrScore := computeFinalScore(baseTPS, baseSuccess, baseP50, baseP99, baseCorrect, 0.0)
	// Notice: combinedConcurrencyScore = 0.85*0 + 0.15*degradationScore. If degradationScore > 0, score is > 0!
	t.Logf("Zero Tracer Concurrency Score (Tracer=0): %.2f (due to 15%% degradation blend)", zeroConcurrScore)

	// 6. Impact of Tracer=0 default in leaderboard.go (line 118: concurrencyScore := 100.0 if tracerTotal == 0)
	t.Logf("Default Tracer Concurrency Score (Tracer=0 in benchmark): %.2f",
		computeFinalScore(baseTPS, baseSuccess, baseP50, baseP99, baseCorrect, 100.0))
}

func TestScoring_SyntheticEngineLeaderboardRankings(t *testing.T) {
	engines := []EngineProfile{
		{
			Name:             "E1_Correct_Fast",
			TPS:              2000.0,
			SuccessRate:      100.0,
			P50:              2.0,
			P99:              8.0,
			CorrectnessScore: 100.0,
			ConcurrencyScore: 100.0,
			Description:      "Optimal fast, correct matching engine",
		},
		{
			Name:             "E2_Correct_Slow",
			TPS:              200.0,
			SuccessRate:      100.0,
			P50:              20.0,
			P99:              50.0,
			CorrectnessScore: 100.0,
			ConcurrencyScore: 100.0,
			Description:      "Correct but slow matching engine",
		},
		{
			Name:             "E3_Cheater_200OK_Stub",
			TPS:              15000.0,
			SuccessRate:      100.0, // checkCorrectnessStub returns true for 200 OK!
			P50:              0.5,
			P99:              1.5,
			CorrectnessScore: 100.0, // If scenarios return CONTRACT_NOT_SUPPORTED, falls back to computedSuccessRate=100%!
			ConcurrencyScore: 100.0, // If 0 tracers run or default applies
			Description:      "Cheater: returns empty 200 OK without matching",
		},
		{
			Name:             "E4_Cheater_Canned_Scenarios",
			TPS:              10000.0,
			SuccessRate:      100.0,
			P50:              0.8,
			P99:              2.0,
			CorrectnessScore: 100.0, // Passes hardcoded 6 scenarios!
			ConcurrencyScore: 100.0, // Returns hardcoded tracer match!
			Description:      "Cheater: hardcoded canned scenarios + dummy load responses",
		},
		{
			Name:             "E5_Fast_Flaky_2PercentDrops",
			TPS:              5000.0,
			SuccessRate:      98.0,
			P50:              1.0,
			P99:              5000.0, // 2% failure penalty spikes P99 to 5000ms!
			CorrectnessScore: 100.0,
			ConcurrencyScore: 95.0,
			Description:      "Fast engine shedding 2% load (penalized with 5000ms P99)",
		},
		{
			Name:             "E6_Partially_Correct",
			TPS:              1000.0,
			SuccessRate:      100.0,
			P50:              5.0,
			P99:              15.0,
			CorrectnessScore: 65.0, // Passes 4 of 6 scenarios (65%)
			ConcurrencyScore: 100.0,
			Description:      "Matches basic orders but fails price sweep and FIFO",
		},
		{
			Name:             "E7_High_Tail_Degradation",
			TPS:              1000.0,
			SuccessRate:      100.0,
			P50:              1.0,
			P99:              100.0, // P99/P50 ratio = 100! Extreme tail latency
			CorrectnessScore: 100.0,
			ConcurrencyScore: 100.0,
			Description:      "Lock contention: low median, extreme tail latency",
		},
	}

	type RankedEngine struct {
		Profile EngineProfile
		Score   float64
	}

	ranked := make([]RankedEngine, len(engines))
	for i, e := range engines {
		score := computeFinalScore(e.TPS, e.SuccessRate, e.P50, e.P99, e.CorrectnessScore, e.ConcurrencyScore)
		ranked[i] = RankedEngine{Profile: e, Score: score}
	}

	// Sort descending by score
	sort.Slice(ranked, func(i, j int) bool {
		return ranked[i].Score > ranked[j].Score
	})

	t.Log("=== SIMULATED LEADERBOARD RANKINGS ===")
	t.Logf("%-4s | %-28s | %8s | %7s | %8s | %10s | %11s", "Rank", "Engine", "Score", "TPS", "P99(ms)", "Correct%", "Concurrency%")
	t.Logf("----------------------------------------------------------------------------------------------------")
	for r, item := range ranked {
		t.Logf("#%-3d | %-28s | %8.2f | %7.0f | %8.1f | %9.1f%% | %10.1f%%",
			r+1, item.Profile.Name, item.Score, item.Profile.TPS, item.Profile.P99, item.Profile.CorrectnessScore, item.Profile.ConcurrencyScore)
	}

	// CRITICAL AUDIT VERIFICATION:
	// Does the Cheater (E4_Cheater_Canned_Scenarios or E3) beat the legitimate Correct Engine (E1)?
	topEngine := ranked[0].Profile.Name
	t.Logf("Top-Ranked Engine: %s with Score %.2f", topEngine, ranked[0].Score)

	if topEngine == "E4_Cheater_Canned_Scenarios" || topEngine == "E3_Cheater_200OK_Stub" {
		t.Logf("CONFIRMED DEFECT / EXPLOIT: Cheater engine '%s' achieved Rank #1 over legitimate matching engines!", topEngine)
	} else {
		t.Errorf("Expected cheater engine to exploit formula and take #1, but got %s", topEngine)
	}
}
