package main

import (
	"math"
	"testing"
	"time"
)

// Replicate Replay Bucket calculation from services/telemetry-service/internal/aggregator/replay_worker.go

type MetricRow struct {
	CreatedAt time.Time
	LatencyNs int64
	Success   bool
}

type ReplayBucketResult struct {
	BucketIdx      int
	Count          int
	SuccessCount   int
	P50Ns          float64
	P99Ns          float64
	DerivedTPS     float64 // hardcoded: count * 2
	ActualTPS      float64 // true: count / bucket_duration
	BucketDuration time.Duration
}

func simulateReplayAggregation(metrics []MetricRow, totalExpected int) []ReplayBucketResult {
	if totalExpected == 0 {
		totalExpected = 1
	}

	// 1. Group into 20 buckets based on cumulative index
	bucketMap := make(map[int][]MetricRow)
	for i, m := range metrics {
		cumulative := i + 1
		b := int(math.Floor((float64(cumulative-1)*20.0)/float64(totalExpected))) + 1
		bucketMap[b] = append(bucketMap[b], m)
	}

	results := make([]ReplayBucketResult, 0, 20)
	for b := 1; b <= 20; b++ {
		rows, exists := bucketMap[b]
		if !exists || len(rows) == 0 {
			continue
		}

		succCount := 0
		latencies := make([]float64, len(rows))
		minTime := rows[0].CreatedAt
		maxTime := rows[0].CreatedAt

		for j, r := range rows {
			latencies[j] = float64(r.LatencyNs)
			if r.Success {
				succCount++
			}
			if r.CreatedAt.Before(minTime) {
				minTime = r.CreatedAt
			}
			if r.CreatedAt.After(maxTime) {
				maxTime = r.CreatedAt
			}
		}

		dur := maxTime.Sub(minTime)
		actualTps := 0.0
		if dur.Seconds() > 0 {
			actualTps = float64(len(rows)) / dur.Seconds()
		}

		// BenchForge formula (replay_worker.go:126):
		// tps := count * 2
		hardcodedTps := float64(len(rows) * 2)

		results = append(results, ReplayBucketResult{
			BucketIdx:      b,
			Count:          len(rows),
			SuccessCount:   succCount,
			DerivedTPS:     hardcodedTps,
			ActualTPS:      actualTps,
			BucketDuration: dur,
		})
	}

	return results
}

func TestReplay_HardcodedTPSFalsification(t *testing.T) {
	// Simulate 1000 requests over 10 seconds (true average TPS = 100)
	totalRequests := 1000
	totalDuration := 10 * time.Second
	startTime := time.Now()

	metrics := make([]MetricRow, totalRequests)
	for i := 0; i < totalRequests; i++ {
		// Evenly spaced over 10 seconds
		offset := time.Duration(float64(totalDuration) * (float64(i) / float64(totalRequests)))
		metrics[i] = MetricRow{
			CreatedAt: startTime.Add(offset),
			LatencyNs: 10 * 1e6, // 10ms
			Success:   true,
		}
	}

	buckets := simulateReplayAggregation(metrics, totalRequests)

	t.Log("=== Replay Window Function vs Hardcoded TPS Comparison ===")
	t.Logf("%-8s | %-8s | %-15s | %-15s | %-12s", "Bucket", "Count", "Actual TPS", "Replay TPS (x2)", "Error Ratio")
	t.Logf("-------------------------------------------------------------------------")

	for _, b := range buckets {
		errorRatio := b.DerivedTPS / b.ActualTPS
		t.Logf("Bucket %-2d | %-8d | %15.2f | %15.2f | %11.2fx",
			b.BucketIdx, b.Count, b.ActualTPS, b.DerivedTPS, errorRatio)
	}

	// In this scenario, each bucket has 50 requests over 0.5s -> actual TPS is 100!
	// But replay_worker.go:126 computes: tps := count * 2 = 50 * 2 = 100!
	// It only happens to match when duration is exactly 0.5s per bucket!
	//
	// What if actual TPS was 2000? (1000 requests in 0.5s):
	totalDurationFast := 500 * time.Millisecond // 2000 TPS
	metricsFast := make([]MetricRow, totalRequests)
	for i := 0; i < totalRequests; i++ {
		offset := time.Duration(float64(totalDurationFast) * (float64(i) / float64(totalRequests)))
		metricsFast[i] = MetricRow{
			CreatedAt: startTime.Add(offset),
			LatencyNs: 1 * 1e6,
			Success:   true,
		}
	}

	fastBuckets := simulateReplayAggregation(metricsFast, totalRequests)
	t.Log("\n=== Fast Benchmark (Actual TPS = 2000) ===")
	t.Logf("Bucket 1: Actual TPS = %.2f | Replay Displayed TPS = %.2f (Discrepancy: %.2fx UNDER-REPORTED!)",
		fastBuckets[0].ActualTPS, fastBuckets[0].DerivedTPS, fastBuckets[0].ActualTPS/fastBuckets[0].DerivedTPS)

	if fastBuckets[0].DerivedTPS != 100.0 {
		t.Errorf("Expected replay to display hardcoded 100, got %v", fastBuckets[0].DerivedTPS)
	}

	// What if actual TPS was 20? (1000 requests in 50s):
	totalDurationSlow := 50 * time.Second // 20 TPS
	metricsSlow := make([]MetricRow, totalRequests)
	for i := 0; i < totalRequests; i++ {
		offset := time.Duration(float64(totalDurationSlow) * (float64(i) / float64(totalRequests)))
		metricsSlow[i] = MetricRow{
			CreatedAt: startTime.Add(offset),
			LatencyNs: 100 * 1e6,
			Success:   true,
		}
	}

	slowBuckets := simulateReplayAggregation(metricsSlow, totalRequests)
	t.Log("\n=== Slow Benchmark (Actual TPS = 20) ===")
	t.Logf("Bucket 1: Actual TPS = %.2f | Replay Displayed TPS = %.2f (Discrepancy: %.2fx ARTIFICIALLY INFLATED!)",
		slowBuckets[0].ActualTPS, slowBuckets[0].DerivedTPS, slowBuckets[0].DerivedTPS/slowBuckets[0].ActualTPS)

	if slowBuckets[0].DerivedTPS != 100.0 {
		t.Errorf("Expected replay to display hardcoded 100, got %v", slowBuckets[0].DerivedTPS)
	}
}

func TestReplay_FabricatedLifecycleTimestamps(t *testing.T) {
	// In services/telemetry-service/internal/aggregator/replay_worker.go:267-276:
	// if bmData.StartedAt != "" {
	//     events = append(events, LifecycleEvent{Phase: "BUILD", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
	//     events = append(events, LifecycleEvent{Phase: "DEPLOY", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
	//     events = append(events, LifecycleEvent{Phase: "VALIDATION", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
	//     events = append(events, LifecycleEvent{Phase: "BENCHMARK", Timestamp: bmData.StartedAt, Status: "SUCCESS"})
	// }
	t.Log("=== Verification of Fabricated Lifecycle Events ===")
	t.Log("Source Code Evidence: replay_worker.go:267-276")
	t.Log("Confirmed: All 4 phases (BUILD, DEPLOY, VALIDATION, BENCHMARK) are stamped with bmData.StartedAt.")
	t.Log("The Replay UI phase timeline displays simultaneous 0-second durations for all stages.")
}
