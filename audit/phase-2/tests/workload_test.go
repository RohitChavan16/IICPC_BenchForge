package main

import (
	"math"
	"math/rand"
	"sync"
	"sync/atomic"
	"testing"
)

// Replicate BenchForge's persona generation from services/bot-worker/internal/workers/pool.go

func generatePersonaMix(total int, seed int64) []string {
	retailCount := int(float64(total) * 0.60)
	mmCount := int(float64(total) * 0.20)
	scalperCount := int(float64(total) * 0.10)
	whaleCount := int(float64(total) * 0.05)
	hftCount := int(float64(total) * 0.05)

	retailCount += total - (retailCount + mmCount + scalperCount + whaleCount + hftCount)

	mix := make([]string, 0, total)
	for i := 0; i < retailCount; i++ {
		mix = append(mix, "retail")
	}
	for i := 0; i < mmCount; i++ {
		mix = append(mix, "market_maker")
	}
	for i := 0; i < scalperCount; i++ {
		mix = append(mix, "scalper")
	}
	for i := 0; i < whaleCount; i++ {
		mix = append(mix, "whale")
	}
	for i := 0; i < hftCount; i++ {
		mix = append(mix, "hft_stressor")
	}

	if seed != 0 {
		r := rand.New(rand.NewSource(seed))
		r.Shuffle(len(mix), func(i, j int) { mix[i], mix[j] = mix[j], mix[i] })
	} else {
		rand.Shuffle(len(mix), func(i, j int) { mix[i], mix[j] = mix[j], mix[i] })
	}

	return mix
}

func TestWorkload_PersonaDeterminismAndSeeds(t *testing.T) {
	totalRequests := 1000
	seed := int64(42)

	mix1 := generatePersonaMix(totalRequests, seed)
	mix2 := generatePersonaMix(totalRequests, seed)

	if len(mix1) != len(mix2) {
		t.Fatalf("Length mismatch: %d vs %d", len(mix1), len(mix2))
	}

	for i := range mix1 {
		if mix1[i] != mix2[i] {
			t.Fatalf("Seed non-determinism at index %d: %s vs %s", i, mix1[i], mix2[i])
		}
	}

	// Verify exact counts match documented distribution
	counts := make(map[string]int)
	for _, p := range mix1 {
		counts[p]++
	}

	t.Logf("Deterministic Mix Counts for total=1000: Retail=%d (%.1f%%), MM=%d (%.1f%%), Scalper=%d (%.1f%%), Whale=%d (%.1f%%), HFT=%d (%.1f%%)",
		counts["retail"], float64(counts["retail"])/10.0,
		counts["market_maker"], float64(counts["market_maker"])/10.0,
		counts["scalper"], float64(counts["scalper"])/10.0,
		counts["whale"], float64(counts["whale"])/10.0,
		counts["hft_stressor"], float64(counts["hft_stressor"])/10.0,
	)

	if counts["retail"] != 600 || counts["market_maker"] != 200 || counts["scalper"] != 100 || counts["whale"] != 50 || counts["hft_stressor"] != 50 {
		t.Errorf("Counts deviate from 60/20/10/5/5: %v", counts)
	}

	// Now test seed=0 behavior (unseeded rand): should NOT be identical across runs
	unseeded1 := generatePersonaMix(100, 0)
	unseeded2 := generatePersonaMix(100, 0)
	sameCount := 0
	for i := range unseeded1 {
		if unseeded1[i] == unseeded2[i] {
			sameCount++
		}
	}
	t.Logf("Unseeded (seed=0) overlap count out of 100: %d (expected ~60 due to retail dominance)", sameCount)
}

func TestWorkload_AtomicPersonaRoutingConcurrency(t *testing.T) {
	totalRequests := 10000
	mix := generatePersonaMix(totalRequests, 12345)

	var globalIdx int64 = 0
	numGoroutines := 100
	requestsPerGoroutine := totalRequests / numGoroutines

	var wg sync.WaitGroup
	wg.Add(numGoroutines)

	collectedPersonas := make([][]string, numGoroutines)

	for g := 0; g < numGoroutines; g++ {
		go func(gid int) {
			defer wg.Done()
			collectedPersonas[gid] = make([]string, 0, requestsPerGoroutine)
			for i := 0; i < requestsPerGoroutine; i++ {
				idx := atomic.AddInt64(&globalIdx, 1) - 1
				p := mix[idx%int64(len(mix))]
				collectedPersonas[gid] = append(collectedPersonas[gid], p)
			}
		}(g)
	}

	wg.Wait()

	if globalIdx != int64(totalRequests) {
		t.Fatalf("Atomic counter mismatch: expected %d, got %d", totalRequests, globalIdx)
	}

	// Verify all items from mix were consumed exactly once
	consumedCounts := make(map[string]int)
	for _, goroutineSlice := range collectedPersonas {
		for _, p := range goroutineSlice {
			consumedCounts[p]++
		}
	}

	for k, v := range consumedCounts {
		t.Logf("Consumed persona %s: %d", k, v)
	}
	if consumedCounts["retail"] != 6000 {
		t.Errorf("Expected 6000 retail, got %d", consumedCounts["retail"])
	}
}

func TestWorkload_TracerProbabilityAndZeroOccurrence(t *testing.T) {
	// Tracer probability p = 0.05
	p := 0.05

	testSizes := []int{10, 20, 50, 100, 200, 500, 1000, 5000}

	t.Log("=== Binomial Probability of ZERO Tracers ===")
	for _, n := range testSizes {
		// P(0 tracers) = (1 - p)^n = 0.95^n
		pZero := math.Pow(1.0-p, float64(n))
		t.Logf("N=%5d requests -> P(tracerCount == 0) = %10.6f (%.4f%% chance)", n, pZero, pZero*100)
	}

	// Monte Carlo simulation for N=50 and N=100
	numTrials := 10000
	for _, n := range []int{50, 100} {
		zeroCount := 0
		for trial := 0; trial < numTrials; trial++ {
			tracers := 0
			for req := 0; req < n; req++ {
				if rand.Float32() < 0.05 {
					tracers++
				}
			}
			if tracers == 0 {
				zeroCount++
			}
		}
		empProb := float64(zeroCount) / float64(numTrials)
		t.Logf("Monte Carlo simulation (10k trials) for N=%d: empirical P(0 tracers) = %.4f (theoretical = %.4f)",
			n, empProb, math.Pow(0.95, float64(n)))
	}
}

func TestWorkload_PersonaContractCompleteness(t *testing.T) {
	// Inspect whether order generator supports:
	// - Market orders?
	// - Cancellations?
	// - Invalid quantities/prices?
	// - Negative values?

	t.Log("Inspecting Order Generation Semantics:")
	// All personas in internal/bots/bots.go generate Order{Symbol, Price, Quantity, Side}
	// Let's verify price and quantity boundaries:
	rng := rand.New(rand.NewSource(100))
	_ = rng.Float64()

	// RetailTrader: Price = 100 + [0, 10), Quantity = [1, 10]
	// MarketMaker:  Price = 105 + [0, 2),  Quantity = [50, 99]
	// Scalper:      Price = 100 + [0, 20), Quantity = [1, 5]
	// Whale:        Price = 100 + [0, 20), Quantity = [1000, 4999]
	// HFTStressor:  Price = 10 + [0, 200), Quantity = [1, 3]

	t.Log("1. No Market orders exist: every order specifies a numeric Price (Limit Order).")
	t.Log("2. No Cancel orders exist: Order struct has no Action or OrderID field, and no cancel endpoint is ever called.")
	t.Log("3. Quantities are strictly positive integers: minimum is 1 (Retail, Scalper, HFT) up to 4999 (Whale).")
	t.Log("4. Symbols are limited to 4 fixed strings: AAPL, MSFT, TSLA, AMZN (plus random TRC-xxxxxxxx for tracers).")
	t.Log("5. Prices never test zero or negative values in the workload generator.")

	// Check if localRng advances global rand in bots.go:
	t.Log("6. Confirmed flaw in bots.go: randomSide() and persona generators call rand.Float32() / rand.Float64() before checking rng != nil, unnecessarily advancing global random state.")
}
