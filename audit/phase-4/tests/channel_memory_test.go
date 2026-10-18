package tests

import (
	"runtime"
	"testing"
	"time"
	"unsafe"
)

type RequestMetric struct {
	RequestID    string
	TraceID      string
	TraceContext map[string]string
	BotType      string
	WorkerID     string
	BenchmarkID  string
	Latency      time.Duration
	Success      bool
	Timestamp    time.Time
	StatusCode   int
	Token        string
}

// TestChannelBufferMemoryScaling demonstrates BF-P4-002:
// In bot-worker/cmd/worker/main.go:204-205, channels are sized to TotalRequests.
// Because RequestMetric struct is ~184 bytes, preallocating channels for
// 1M or 5M requests causes instant massive heap memory spikes.
func TestChannelBufferMemoryScaling(t *testing.T) {
	structSize := unsafe.Sizeof(RequestMetric{})
	t.Logf("sizeof(RequestMetric) = %d bytes", structSize)

	testCases := []struct {
		name          string
		totalRequests int
	}{
		{"Small_10K", 10_000},
		{"Medium_100K", 100_000},
		{"Large_1M", 1_000_000},
	}

	for _, tc := range testCases {
		runtime.GC()
		var m1, m2 runtime.MemStats
		runtime.ReadMemStats(&m1)

		// Replicate main.go:204-205 channel allocation
		jobs := make(chan int, tc.totalRequests)
		results := make(chan RequestMetric, tc.totalRequests)

		runtime.ReadMemStats(&m2)
		allocatedBytes := m2.HeapAlloc - m1.HeapAlloc
		allocatedMB := float64(allocatedBytes) / (1024 * 1024)

		t.Logf("[%s] Requests: %d -> Heap Allocated: %.2f MB", tc.name, tc.totalRequests, allocatedMB)

		// Clean up
		_ = jobs
		_ = results
	}

	// Compare with Bounded Channel (Streaming buffer of 10,000)
	runtime.GC()
	var m1, m2 runtime.MemStats
	runtime.ReadMemStats(&m1)

	boundedJobs := make(chan int, 10_000)
	boundedResults := make(chan RequestMetric, 10_000)

	runtime.ReadMemStats(&m2)
	boundedMB := float64(m2.HeapAlloc-m1.HeapAlloc) / (1024 * 1024)
	t.Logf("[Bounded_Streaming] Buffer: 10,000 -> Heap Allocated: %.2f MB (Safe for any workload size)", boundedMB)

	_ = boundedJobs
	_ = boundedResults
}
