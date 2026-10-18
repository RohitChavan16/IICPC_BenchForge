package main

import (
	"math"
	"sort"
	"testing"
)

// Replicate LatencyHistogram from bot-worker/cmd/worker/percentiles.go

type Hist struct {
	buckets []int
	total   int
}

func NewHist(maxMs int) *Hist {
	return &Hist{buckets: make([]int, maxMs+1)}
}

func (h *Hist) Add(ms float64) {
	b := int(math.Round(ms))
	if b < 0 {
		b = 0
	}
	if b >= len(h.buckets) {
		b = len(h.buckets) - 1
	}
	h.buckets[b]++
	h.total++
}

func (h *Hist) Percentile(p float64) float64 {
	if h.total == 0 {
		return 0
	}
	target := int(math.Ceil(float64(h.total) * (p / 100.0)))
	if target == 0 {
		target = 1
	}
	count := 0
	for i, b := range h.buckets {
		count += b
		if count >= target {
			return float64(i)
		}
	}
	return float64(len(h.buckets) - 1)
}

// Replicate Telemetry Service's Percentile algorithm from services/telemetry-service/internal/aggregator/aggregator.go

func TelemetryCalculatePercentile(latencies []float64, percentile float64) float64 {
	if len(latencies) == 0 {
		return 0
	}
	cpy := make([]float64, len(latencies))
	copy(cpy, latencies)
	sort.Float64s(cpy)
	index := int((percentile / 100.0) * float64(len(cpy)-1))
	return cpy[index]
}

// Standard Mathematical Percentile (Linear Interpolation / NIST / NumPy method 7)
func LinearInterpolatedPercentile(data []float64, p float64) float64 {
	if len(data) == 0 {
		return 0
	}
	if len(data) == 1 {
		return data[0]
	}
	cpy := make([]float64, len(data))
	copy(cpy, data)
	sort.Float64s(cpy)

	rank := (p / 100.0) * float64(len(cpy)-1)
	lowerIdx := int(math.Floor(rank))
	upperIdx := int(math.Ceil(rank))
	weight := rank - float64(lowerIdx)

	return cpy[lowerIdx]*(1.0-weight) + cpy[upperIdx]*weight
}

func TestMetrics_HistogramVsTelemetryVsInterpolated(t *testing.T) {
	// Sample data set of 100 values: 1ms to 100ms
	data := make([]float64, 100)
	for i := 0; i < 100; i++ {
		data[i] = float64(i + 1)
	}

	hist := NewHist(10000)
	for _, v := range data {
		hist.Add(v)
	}

	percentiles := []float64{50.0, 90.0, 95.0, 99.0}

	t.Log("=== Comparing Percentile Algorithms on N=100 Uniform Distribution (1..100) ===")
	for _, p := range percentiles {
		hVal := hist.Percentile(p)
		tVal := TelemetryCalculatePercentile(data, p)
		lVal := LinearInterpolatedPercentile(data, p)
		t.Logf("P%.0f: Bot-Worker Histogram = %.2f ms | Telemetry Service = %.2f ms | Linear Interpolated = %.2f ms",
			p, hVal, tVal, lVal)

		// Check difference
		diff := math.Abs(hVal - tVal)
		if diff > 1.0 {
			t.Errorf("Significant divergence between bot-worker and telemetry on P%.0f: diff=%.2f", p, diff)
		}
	}
}

func TestMetrics_FailurePenaltyImpactOnPercentiles(t *testing.T) {
	// BenchForge penalty policy: failed requests get 5000ms latency.
	// Let's verify what happens when 1%, 2%, 5%, 10% of requests fail on a 10ms baseline engine:
	totalRequests := 1000
	baselineLatency := 10.0 // ms
	failureRates := []float64{0.0, 0.01, 0.02, 0.05, 0.10, 0.50}

	t.Log("=== Impact of 5000ms Failure Penalty on P50, P90, P99 ===")
	for _, failRate := range failureRates {
		failCount := int(float64(totalRequests) * failRate)
		successCount := totalRequests - failCount

		hist := NewHist(10000)
		for i := 0; i < successCount; i++ {
			hist.Add(baselineLatency)
		}
		for i := 0; i < failCount; i++ {
			hist.Add(5000.0) // 5000ms penalty
		}

		p50 := hist.Percentile(50)
		p90 := hist.Percentile(90)
		p99 := hist.Percentile(99)

		t.Logf("Failure Rate = %5.1f%% (%3d failures / 1000) -> P50=%6.1f ms, P90=%6.1f ms, P99=%6.1f ms",
			failRate*100, failCount, p50, p90, p99)

		if failRate >= 0.02 && p99 < 5000.0 {
			t.Errorf("At >=2%% failures, P99 should be 5000ms, got %v", p99)
		}
		if failRate >= 0.11 && p90 < 5000.0 {
			t.Errorf("At >=11%% failures, P90 should be 5000ms, got %v", p90)
		}
	}
}

func TestMetrics_LatencyUnitDiscrepancy(t *testing.T) {
	// In bot-worker pool.go:
	// metric.Latency = latency (time.Duration = nanoseconds)
	// When serialized to JSON: {"latency": 15000000} (15 million ns for 15ms)
	//
	// In telemetry-service consumer.go:
	// Metric struct parses Latency as int64 (15000000)
	// In-memory aggregator: agg.AddMetric(float64(metric.Latency), ...) -> adds 15000000
	// PostgreSQL database: inserts 15000000 into telemetry_metrics.latency
	// Replay query: PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency) -> returns 15000000
	//
	// Meanwhile, in bot-worker main.go:
	// hist.Add(result.Latency.Seconds() * 1000) -> adds 15.0 (milliseconds)
	// benchmarks table: p50, p90, p99 = 15.0
	// leaderboard formula: 250 / (250 + p99) -> uses 15.0

	latencyDuration := 15 * 1e6 // 15ms in nanoseconds
	latencyMs := float64(latencyDuration) / 1e6

	// Latency factor using correct ms
	correctFactor := 250.0 / (250.0 + latencyMs) // 250 / 265 = 0.9434

	// Latency factor if ns were used accidentally
	corruptedFactor := 250.0 / (250.0 + float64(latencyDuration)) // 250 / 15000250 = 0.0000166

	t.Logf("=== Latency Unit Discrepancy Evidence ===")
	t.Logf("Bot-Worker Benchmarks Table P99: %.2f ms", latencyMs)
	t.Logf("Telemetry Table / Replay Window Function P99: %.0f ns (1,000,000x difference!)", float64(latencyDuration))
	t.Logf("Leaderboard Latency Factor with ms: %.4f", correctFactor)
	t.Logf("Leaderboard Latency Factor if ns were used: %.8f (99.998%% score wipeout!)", corruptedFactor)

	if correctFactor/corruptedFactor < 10000 {
		t.Errorf("Unexpected ratio")
	}
}

func TestMetrics_ThroughputAccountingEdgeCases(t *testing.T) {
	// Check throughput definition in bot-worker vs leaderboard:
	// bot-worker:
	// duration := time.Since(start)
	// tps := float64(completedJobs) / duration.Seconds()
	//
	// leaderboard.go:
	// dur := int(duration.Int64)
	// computedTps := float64(total) / float64(dur)

	t.Log("=== Throughput Accounting & Integer Truncation ===")
	// Case 1: Duration < 1 second (e.g. 800ms)
	totalRequests := 500
	actualDuration := 0.8 // seconds
	botWorkerTps := float64(totalRequests) / actualDuration // 625.0

	// In database, duration_seconds is INTEGER!
	durSecondsDB := int(actualDuration) // 0!
	var leaderboardTps float64
	if durSecondsDB > 0 {
		leaderboardTps = float64(totalRequests) / float64(durSecondsDB)
	} else {
		leaderboardTps = 0.0 // Line 102-105: if dur > 0 ... else 0.0
	}

	t.Logf("Case 1 (Duration < 1.0s, e.g. 800ms):")
	t.Logf("  Bot-worker calculated TPS: %.2f", botWorkerTps)
	t.Logf("  Leaderboard stored TPS:    %.2f (ZERO score because duration truncated to 0!)", leaderboardTps)

	if leaderboardTps != 0.0 {
		t.Errorf("Expected 0.0 TPS due to integer duration truncation")
	}

	// Case 2: Duration rounding error (e.g. 1.9 seconds)
	actualDuration2 := 1.9
	botWorkerTps2 := float64(totalRequests) / actualDuration2 // 263.15
	durSecondsDB2 := int(actualDuration2)                     // truncated to 1 second!
	leaderboardTps2 := float64(totalRequests) / float64(durSecondsDB2) // 500.0!

	t.Logf("Case 2 (Duration = 1.9s):")
	t.Logf("  Bot-worker calculated TPS: %.2f", botWorkerTps2)
	t.Logf("  Leaderboard stored TPS:    %.2f (90%% inflation due to integer truncation of 1.9s -> 1s!)", leaderboardTps2)

	if leaderboardTps2 <= botWorkerTps2 {
		t.Errorf("Expected inflation due to floor truncation")
	}
}
