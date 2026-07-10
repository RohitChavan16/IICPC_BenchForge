package main

import (
	"fmt"
	"math"
	"math/rand"
	"sort"
)

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

func oldPercentileCalc(latenciesMs []float64, p float64) float64 {
	if len(latenciesMs) == 0 {
		return 0
	}
	if len(latenciesMs) == 1 {
		return latenciesMs[0]
	}
	rank := p / 100 * float64(len(latenciesMs)-1)
	lowerIndex := int(math.Floor(rank))
	upperIndex := int(math.Ceil(rank))
	if lowerIndex == upperIndex {
		return latenciesMs[lowerIndex]
	}
	weight := rank - float64(lowerIndex)
	return latenciesMs[lowerIndex]*(1-weight) + latenciesMs[upperIndex]*weight
}

func main() {
	// Fixed seed for deterministic comparison
	rand.Seed(42)
	sizes := []int{1000, 5000, 50000, 100000}
	
	fmt.Println("Requests | Old P99 | New P99 | Difference | Error %")
	fmt.Println("-----------------------------------------------------")
	
	for _, size := range sizes {
		var latencies []float64
		hist := NewLatencyHistogram(10000)
		
		for i := 0; i < size; i++ {
			lat := rand.ExpFloat64() * 50.0 // mean 50ms
			if rand.Float32() < 0.05 {
				lat += 200 + rand.Float64()*500 // 5% spikes
			}
			if rand.Float32() < 0.01 {
				lat = 5000.0 // 1% failures
			}
			latencies = append(latencies, lat)
			hist.Add(lat)
		}
		
		sort.Float64s(latencies)
		oldP50 := oldPercentileCalc(latencies, 50.0)
		newP50 := hist.Percentile(50.0)
		oldP90 := oldPercentileCalc(latencies, 90.0)
		newP90 := hist.Percentile(90.0)
		oldP99 := oldPercentileCalc(latencies, 99.0)
		newP99 := hist.Percentile(99.0)
		
		fmt.Printf("%8d | %7.2f | %7.2f | %7.2f | %7.2f | %7.2f | %7.2f\n", size, oldP50, newP50, oldP90, newP90, oldP99, newP99)
	}
}
