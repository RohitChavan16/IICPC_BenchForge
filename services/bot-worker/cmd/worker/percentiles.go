package main

import (
	"math"
	"sort"

	"github.com/RohitChavan16/IICPC_BenchForge/services/bot-worker/internal/metrics"
)

func calculatePercentiles(metricsList []metrics.RequestMetric) (float64, float64, float64) {
	if len(metricsList) == 0 {
		return 0, 0, 0
	}

	latenciesMs := make([]float64, 0, len(metricsList))
	for _, metric := range metricsList {
		latenciesMs = append(latenciesMs, metric.Latency.Seconds()*1000)
	}

	sort.Float64s(latenciesMs)

	return percentile(latenciesMs, 50), percentile(latenciesMs, 90), percentile(latenciesMs, 99)
}

func percentile(sortedValues []float64, percentileValue float64) float64 {
	if len(sortedValues) == 0 {
		return 0
	}

	if len(sortedValues) == 1 {
		return sortedValues[0]
	}

	rank := percentileValue / 100 * float64(len(sortedValues)-1)
	lowerIndex := int(math.Floor(rank))
	upperIndex := int(math.Ceil(rank))

	if lowerIndex == upperIndex {
		return sortedValues[lowerIndex]
	}

	weight := rank - float64(lowerIndex)
	return sortedValues[lowerIndex]*(1-weight) + sortedValues[upperIndex]*weight
}
