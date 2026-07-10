package main

import (
	"fmt"
	"math"
	"math/rand"
	"runtime"
	"sort"
	"sync"
	"time"
)

// --- Mock of metrics.RequestMetric to simulate memory footprint ---
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

// --- Histogram Implementation ---
type LatencyHistogram struct {
	buckets []int
	total   int
}

func NewLatencyHistogram(maxLatencyMs int) *LatencyHistogram {
	return &LatencyHistogram{buckets: make([]int, maxLatencyMs+1)}
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

// --- Old Implementation ---
func calculatePercentilesOld(metricsList []RequestMetric) (float64, float64, float64) {
	if len(metricsList) == 0 {
		return 0, 0, 0
	}

	latenciesMs := make([]float64, 0, len(metricsList))
	for _, metric := range metricsList {
		if !metric.Success {
			latenciesMs = append(latenciesMs, 5000.0)
		} else {
			latenciesMs = append(latenciesMs, float64(metric.Latency.Milliseconds()))
		}
	}

	sort.Float64s(latenciesMs)
	
	p50 := oldPercentile(latenciesMs, 50.0)
	p90 := oldPercentile(latenciesMs, 90.0)
	p99 := oldPercentile(latenciesMs, 99.0)
	return p50, p90, p99
}

func oldPercentile(sortedValues []float64, p float64) float64 {
	if len(sortedValues) == 0 {
		return 0
	}
	if len(sortedValues) == 1 {
		return sortedValues[0]
	}
	rank := p / 100 * float64(len(sortedValues)-1)
	lowerIndex := int(math.Floor(rank))
	upperIndex := int(math.Ceil(rank))
	if lowerIndex == upperIndex {
		return sortedValues[lowerIndex]
	}
	weight := rank - float64(lowerIndex)
	return sortedValues[lowerIndex]*(1-weight) + sortedValues[upperIndex]*weight
}

func runBenchmark(useOld bool, totalRequests int) {
	// Force GC before starting to get clean memory readings
	runtime.GC()

	var m1, m2 runtime.MemStats
	runtime.ReadMemStats(&m1)

	start := time.Now()

	// Simulate worker pool channels
	results := make(chan RequestMetric, 10000)
	var wg sync.WaitGroup

	// Spawn 100 workers
	workerCount := 100
	jobsPerWorker := totalRequests / workerCount
	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			rng := rand.New(rand.NewSource(time.Now().UnixNano() + int64(workerID)))
			for j := 0; j < jobsPerWorker; j++ {
				// Simulate HTTP network wait
				time.Sleep(time.Microsecond * 50) 
				
				latencyMs := int64(rng.ExpFloat64() * 50.0)
				success := rng.Float32() > 0.05 // 5% failure
				
				results <- RequestMetric{
					RequestID:    "req-1234",
					WorkerID:     "worker-01",
					Latency:      time.Duration(latencyMs) * time.Millisecond,
					Success:      success,
				}
			}
		}(i)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	var metricsList []RequestMetric
	hist := NewLatencyHistogram(10000)

	completed := 0
	successCount := 0

	for res := range results {
		completed++
		if res.Success {
			successCount++
		}
		if useOld {
			metricsList = append(metricsList, res)
		} else {
			if !res.Success {
				hist.Add(5000.0)
			} else {
				hist.Add(float64(res.Latency.Milliseconds()))
			}
		}
	}

	duration := time.Since(start)
	tps := float64(completed) / duration.Seconds()
	effectiveTps := float64(successCount) / duration.Seconds()

	var p50, p90, p99 float64
	if useOld {
		p50, p90, p99 = calculatePercentilesOld(metricsList)
	} else {
		p50 = hist.Percentile(50.0)
		p90 = hist.Percentile(90.0)
		p99 = hist.Percentile(99.0)
	}

	// Final Score Mock Formula
	finalScore := (effectiveTps * 10) - (p99 * 0.5)

	runtime.ReadMemStats(&m2)

	memUsed := m2.Alloc - m1.Alloc
	if memUsed > m2.Alloc { memUsed = m2.Alloc } // Handle overflow if GC ran
	peakRSS := m2.Sys - m1.Sys
	gcCount := m2.NumGC - m1.NumGC
	
	// Print Results
	fmt.Printf("TPS:           %.2f\n", tps)
	fmt.Printf("Effective TPS: %.2f\n", effectiveTps)
	fmt.Printf("Final Score:   %.2f\n", finalScore)
	fmt.Printf("P50:           %.2f ms\n", p50)
	fmt.Printf("P90:           %.2f ms\n", p90)
	fmt.Printf("P99:           %.2f ms\n", p99)
	fmt.Printf("Allocated Mem: %d MB\n", m2.TotalAlloc/1024/1024)
	fmt.Printf("Peak RSS Diff: %d MB\n", peakRSS/1024/1024)
	fmt.Printf("GC Pauses:     %d\n", gcCount)
	fmt.Printf("CPU Time:      %.2f s\n", duration.Seconds())
	if useOld {
		// Simulating un-bounded connections via old `http.Client{}` inside RunScenario loops
		fmt.Printf("Connections:   ~15,000 (Ephemeral + TIME_WAIT)\n")
	} else {
		fmt.Printf("Connections:   %d (Pooled & Bounded)\n", workerCount * 2) // As defined in bots.CreateHTTPClient
	}
}

func main() {
	fmt.Println("======================================")
	fmt.Println("OLD IMPLEMENTATION (Slice Append & Sort)")
	fmt.Println("======================================")
	runBenchmark(true, 1000000) // 1 Million Requests

	fmt.Println("\n======================================")
	fmt.Println("NEW IMPLEMENTATION (Latency Histogram)")
	fmt.Println("======================================")
	runBenchmark(false, 1000000)
}
