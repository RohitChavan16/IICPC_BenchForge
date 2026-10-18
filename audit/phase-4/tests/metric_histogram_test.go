package tests

import (
	"math"
	"sort"
	"testing"
)

// LatencyHistogram replicates the exact implementation from
// services/bot-worker/cmd/worker/percentiles.go
type LatencyHistogram struct {
	buckets []int
	total   int
}

func NewLatencyHistogram(maxLatencyMs int) *LatencyHistogram {
	return &LatencyHistogram{
		buckets: make([]int, maxLatencyMs+1),
	}
}

func (h *LatencyHistogram) Add(latencyMs float64) {
	bucket := int(math.Round(latencyMs))
	if bucket < 0 {
		bucket = 0
	}
	if bucket >= len(h.buckets) {
		bucket = len(h.buckets) - 1
	}
	h.buckets[bucket]++
	h.total++
}

func (h *LatencyHistogram) Percentile(p float64) float64 {
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

// exactPercentile computes true floating-point percentile from raw values
func exactPercentile(vals []float64, p float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	sorted := make([]float64, len(vals))
	copy(sorted, vals)
	sort.Float64s(sorted)

	idx := int(math.Ceil(float64(len(sorted)) * (p / 100.0))) - 1
	if idx < 0 {
		idx = 0
	}
	if idx >= len(sorted) {
		idx = len(sorted) - 1
	}
	return sorted[idx]
}

// TestHistogramSubMillisecondQuantizationDefect demonstrates BF-P4-001:
// Despite claiming "microsecond latency tracking", LatencyHistogram rounds
// all durations to integer milliseconds via math.Round(latencyMs).
// Sub-millisecond trading latencies (<0.5ms) round to 0ms, masking true latency.
func TestHistogramSubMillisecondQuantizationDefect(t *testing.T) {
	hist := NewLatencyHistogram(10000)

	// Simulating 10,000 requests of high-performance matching engine latencies
	// Range: 150us (0.15ms) to 480us (0.48ms)
	rawLatencies := make([]float64, 10000)
	for i := 0; i < 10000; i++ {
		// Latencies in milliseconds: 0.15ms to 0.45ms (150µs - 450µs)
		ms := 0.15 + float64(i%30)*0.01
		rawLatencies[i] = ms
		hist.Add(ms)
	}

	exactP50 := exactPercentile(rawLatencies, 50)
	exactP99 := exactPercentile(rawLatencies, 99)

	histP50 := hist.Percentile(50)
	histP99 := hist.Percentile(99)

	t.Logf("Raw Ground Truth: P50=%.3f ms (%.1f µs), P99=%.3f ms (%.1f µs)",
		exactP50, exactP50*1000, exactP99, exactP99*1000)
	t.Logf("BenchForge Hist : P50=%.1f ms, P99=%.1f ms", histP50, histP99)

	if histP50 != 0.0 {
		t.Errorf("Expected BenchForge histogram to truncate sub-millisecond P50 to 0.0 ms, got %.2f", histP50)
	}
	if histP99 != 0.0 {
		t.Errorf("Expected BenchForge histogram to truncate sub-millisecond P99 to 0.0 ms, got %.2f", histP99)
	}

	// Calculate quantization distortion
	distortion := (exactP50 - histP50) / exactP50 * 100.0
	t.Logf("Quantization Error: %.1f%% distortion (sub-millisecond latency completely masked as 0ms)", distortion)
}

// TestHistogramFailedPenaltyDistortion demonstrates how injecting 5000.0 ms
// for failed requests skews tail latency distributions arbitrarily.
func TestHistogramFailedPenaltyDistortion(t *testing.T) {
	hist := NewLatencyHistogram(10000)

	// 98% successful at 2.5ms, 2% failed (injected 5000ms per main.go:293)
	for i := 0; i < 980; i++ {
		hist.Add(2.5) // Rounds to 3ms
	}
	for i := 0; i < 20; i++ {
		hist.Add(5000.0) // Injected penalty
	}

	p90 := hist.Percentile(90)
	p99 := hist.Percentile(99)

	t.Logf("With 2%% failure penalty: P90=%.1f ms, P99=%.1f ms", p90, p99)

	if p99 != 5000.0 {
		t.Errorf("Expected P99 to be forced to 5000.0ms penalty by 2%% failure, got %.1f", p99)
	}
}
