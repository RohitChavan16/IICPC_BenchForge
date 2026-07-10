package main

import (
	"math"
)

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
