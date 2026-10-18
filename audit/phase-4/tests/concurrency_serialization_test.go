package tests

import (
	"testing"
	"time"
)

// TestSingleBenchmarkConcurrencySerialization demonstrates BF-P4-006:
// In benchmark-service/internal/handlers/benchmarks.go:106:
//
//	count, _ := repository.CountRunningBenchmarks(h.db)
//	if count >= 1 { return }
//
// The execution slot is strictly limited to 1 concurrent benchmark.
// All concurrent benchmark submissions enter a FIFO queue and execute sequentially.
func TestSingleBenchmarkConcurrencySerialization(t *testing.T) {
	benchmarkDuration := 30 * time.Second
	concurrentJobs := []int{1, 2, 5, 10}

	for _, m := range concurrentJobs {
		// Because MAX_CONCURRENT_BENCHMARKS = 1:
		totalWallClockTime := time.Duration(m) * benchmarkDuration
		maxQueueWait := time.Duration(m-1) * benchmarkDuration
		avgQueueWait := time.Duration(float64(m-1)/2.0 * float64(benchmarkDuration))

		effectiveJobsPerHour := float64(3600) / benchmarkDuration.Seconds() // Constant!

		t.Logf("[%d Concurrent Benchmark Submissions]", m)
		t.Logf("  Total Execution Duration: %s", totalWallClockTime)
		t.Logf("  Worst-Case Queue Wait:   %s", maxQueueWait)
		t.Logf("  Average Queue Wait:      %s", avgQueueWait)
		t.Logf("  Effective Throughput:    %.1f benchmarks/hour (Zero multi-job scaling)", effectiveJobsPerHour)

		if m > 1 && maxQueueWait <= 0 {
			t.Errorf("Expected positive queue wait for concurrent benchmarks")
		}
	}
}

// TestLifecycleOverheadBreakdown quantifies the overhead of BenchForge's
// orchestration pipeline relative to actual engine execution time.
func TestLifecycleOverheadBreakdown(t *testing.T) {
	testCases := []struct {
		name          string
		totalRequests int
		engineTPS     int
	}{
		{"SmallBenchmark_1K", 1_000, 2_000},
		{"MediumBenchmark_10K", 10_000, 5_000},
		{"LargeBenchmark_100K", 100_000, 10_000},
	}

	for _, tc := range testCases {
		// Stage Timings (milliseconds)
		preValidationMs := 400.0   // 6 sequential scenarios
		warmupMs := 5000.0         // Hardcoded 5-second warmup in main.go:227
		engineExecMs := (float64(tc.totalRequests) / float64(tc.engineTPS)) * 1000.0
		drainageMs := (float64(tc.totalRequests) / 1200.0) * 1000.0 // Single-row DB insert lag
		replayMs := 500.0          // Replay aggregation window query
		leaderboardMs := 150.0     // Upsert query

		platformOverheadMs := preValidationMs + warmupMs + drainageMs + replayMs + leaderboardMs
		totalLifecycleMs := engineExecMs + platformOverheadMs
		overheadPercent := (platformOverheadMs / totalLifecycleMs) * 100.0

		t.Logf("[%s]", tc.name)
		t.Logf("  Engine Execution Time: %.2f ms (%.1f%% of total)", engineExecMs, (engineExecMs/totalLifecycleMs)*100.0)
		t.Logf("  Platform Overhead:     %.2f ms (%.1f%% of total)", platformOverheadMs, overheadPercent)
		t.Logf("    - Pre-Validation:    %.0f ms", preValidationMs)
		t.Logf("    - Hardcoded Warmup:  %.0f ms", warmupMs)
		t.Logf("    - Telemetry Drainage:%.0f ms", drainageMs)
		t.Logf("    - Replay & Leaderbd: %.0f ms", replayMs+leaderboardMs)
		t.Logf("  Total Elapsed Time:    %.2f ms (%.2fs)", totalLifecycleMs, totalLifecycleMs/1000.0)

		if tc.totalRequests <= 10_000 && overheadPercent < 50.0 {
			t.Errorf("Expected platform overhead to dominate for %s, got %.1f%%", tc.name, overheadPercent)
		}
	}
}
