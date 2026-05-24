package aggregator

import (
	"sort"
)

func CalculatePercentile(latencies []float64, percentile float64) float64 {

	if len(latencies) == 0 {
		return 0
	}

	sort.Float64s(latencies)

	index := int((percentile / 100.0) * float64(len(latencies)-1))

	return latencies[index]
}