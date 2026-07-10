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

type DistributionFunc func() float64

func main() {
	rand.Seed(42)
	size := 100000

	distributions := []struct {
		Name string
		Dist DistributionFunc
	}{
		{
			"No Failures (Log-Normal)",
			func() float64 { return rand.ExpFloat64() * 50.0 },
		},
		{
			"Low Failures (1%)",
			func() float64 {
				if rand.Float32() < 0.01 { return 5000.0 }
				return rand.ExpFloat64() * 50.0
			},
		},
		{
			"High Failures (20%)",
			func() float64 {
				if rand.Float32() < 0.20 { return 5000.0 }
				return rand.ExpFloat64() * 50.0
			},
		},
		{
			"Uniform (10ms-200ms)",
			func() float64 { return 10.0 + rand.Float64()*190.0 },
		},
		{
			"Normal (Mean:100, Std:20)",
			func() float64 { return rand.NormFloat64()*20.0 + 100.0 },
		},
		{
			"Heavy-Tail (Pareto)",
			func() float64 { 
				// Simple pareto using inverse transform sampling
				return 10.0 / math.Pow(rand.Float64(), 1.0/1.5)
			},
		},
	}

	fmt.Println("Distribution           | Old P99 | New P99 | Diff   | Error %")
	fmt.Println("---------------------------------------------------------------")

	for _, d := range distributions {
		var latencies []float64
		hist := NewLatencyHistogram(10000)

		for i := 0; i < size; i++ {
			lat := d.Dist()
			if lat < 0 { lat = 0 }
			latencies = append(latencies, lat)
			hist.Add(lat)
		}

		sort.Float64s(latencies)
		oldP99 := oldPercentileCalc(latencies, 99.0)
		newP99 := hist.Percentile(99.0)
		diff := math.Abs(newP99 - oldP99)
		errPct := 0.0
		if oldP99 > 0 {
			errPct = (diff / oldP99) * 100.0
		}

		fmt.Printf("%-22s | %7.2f | %7.2f | %6.2f | %6.3f%%\n", d.Name, oldP99, newP99, diff, errPct)
	}
}
