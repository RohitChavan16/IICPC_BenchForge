package main

import (
	"math"
	"testing"
)

func TestLatencyHistogram_Percentiles(t *testing.T) {
	tests := []struct {
		name      string
		latencies []float64
		p50       float64
		p90       float64
		p99       float64
	}{
		{
			name:      "Empty histogram",
			latencies: []float64{},
			p50:       0,
			p90:       0,
			p99:       0,
		},
		{
			name:      "Single value",
			latencies: []float64{42.0},
			p50:       42.0,
			p90:       42.0,
			p99:       42.0,
		},
		{
			name:      "Two values",
			latencies: []float64{10.0, 90.0},
			p50:       10.0, // ceil(2 * 0.5) = 1st value
			p90:       90.0, // ceil(2 * 0.9) = 2nd value
			p99:       90.0, // ceil(2 * 0.99) = 2nd value
		},
		{
			name:      "1-100 linear",
			latencies: generateLinear(1, 100),
			p50:       50.0,
			p90:       90.0,
			p99:       99.0,
		},
		{
			name:      "Capped at max",
			latencies: []float64{9999.0, 15000.0, 20000.0},
			p50:       10000.0, // Capped at 10000
			p90:       10000.0,
			p99:       10000.0,
		},
		{
			name:      "Rounding behavior",
			latencies: []float64{1.1, 1.4, 1.5, 1.9},
			// Round(1.1)=1, Round(1.4)=1, Round(1.5)=2, Round(1.9)=2
			// Sorted buckets: [1, 1, 2, 2]
			p50: 1.0, // ceil(4 * 0.5) = 2nd element
			p90: 2.0, // ceil(4 * 0.9) = 4th element
			p99: 2.0, // ceil(4 * 0.99) = 4th element
		},
		{
			name:      "Negative behavior",
			latencies: []float64{-5.0, -10.0, 5.0},
			p50:       0.0, // Capped at 0
			p90:       5.0,
			p99:       5.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hist := NewLatencyHistogram(10000)
			for _, lat := range tt.latencies {
				hist.Add(lat)
			}

			p50 := hist.Percentile(50)
			if math.Abs(p50-tt.p50) > 0.1 {
				t.Errorf("P50: got %v, want %v", p50, tt.p50)
			}

			p90 := hist.Percentile(90)
			if math.Abs(p90-tt.p90) > 0.1 {
				t.Errorf("P90: got %v, want %v", p90, tt.p90)
			}

			p99 := hist.Percentile(99)
			if math.Abs(p99-tt.p99) > 0.1 {
				t.Errorf("P99: got %v, want %v", p99, tt.p99)
			}
		})
	}
}

func generateLinear(start, end int) []float64 {
	res := make([]float64, 0, end-start+1)
	for i := start; i <= end; i++ {
		res = append(res, float64(i))
	}
	return res
}
