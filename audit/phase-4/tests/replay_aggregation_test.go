package tests

import (
	"math/rand"
	"sort"
	"testing"
	"time"
)

type TelemetryRecord struct {
	CreatedAt time.Time
	Latency   int64
	Success   bool
	BotType   string
}

// simulateReplayAggregation models the computational steps executed by
// replay_worker.go:69-93 (Window count, 20-bucket division, 3x Percentile sort per bucket)
func simulateReplayAggregation(records []TelemetryRecord) time.Duration {
	start := time.Now()

	// Step 1: Order by CreatedAt (COUNT(*) OVER (ORDER BY created_at))
	sort.Slice(records, func(i, j int) bool {
		return records[i].CreatedAt.Before(records[j].CreatedAt)
	})

	// Step 2: Bucket into 20 equal chronological windows
	numBuckets := 20
	bucketSize := len(records) / numBuckets
	if bucketSize == 0 {
		bucketSize = 1
	}

	for b := 0; b < numBuckets; b++ {
		startIdx := b * bucketSize
		endIdx := (b + 1) * bucketSize
		if endIdx > len(records) || b == numBuckets-1 {
			endIdx = len(records)
		}
		if startIdx >= endIdx {
			continue
		}

		// Extract latencies for bucket
		bucketLatencies := make([]int64, endIdx-startIdx)
		for i := startIdx; i < endIdx; i++ {
			bucketLatencies[i-startIdx] = records[i].Latency
		}

		// Step 3: 3x PERCENTILE_CONT sorting per bucket
		sort.Slice(bucketLatencies, func(i, j int) bool {
			return bucketLatencies[i] < bucketLatencies[j]
		})

		_ = bucketLatencies[int(float64(len(bucketLatencies))*0.5)]
		_ = bucketLatencies[int(float64(len(bucketLatencies))*0.9)]
		_ = bucketLatencies[int(float64(len(bucketLatencies))*0.99)]
	}

	return time.Since(start)
}

// TestReplayAggregationComputationalComplexity demonstrates BF-P4-005:
// The replay aggregation query scales super-linearly with benchmark request count.
func TestReplayAggregationComputationalComplexity(t *testing.T) {
	sizes := []int{1_000, 10_000, 50_000, 100_000}

	for _, n := range sizes {
		records := make([]TelemetryRecord, n)
		now := time.Now()
		for i := 0; i < n; i++ {
			records[i] = TelemetryRecord{
				CreatedAt: now.Add(time.Duration(i) * time.Millisecond),
				Latency:   int64(rand.Intn(5000000)), // up to 5ms in ns
				Success:   true,
				BotType:   "retail",
			}
		}

		dur := simulateReplayAggregation(records)
		t.Logf("Replay Processing for N=%d records: %s (%.2f ops/sec)",
			n, dur, float64(n)/dur.Seconds())
	}
}
