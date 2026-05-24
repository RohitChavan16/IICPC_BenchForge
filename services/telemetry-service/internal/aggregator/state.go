package aggregator

import (
	"sort"
	"sync"
	"time"
)

type MetricsSnapshot struct {
	TPS         float64 `json:"tps"`
	P50         float64 `json:"p50"`
	P90         float64 `json:"p90"`
	P99         float64 `json:"p99"`
	FailureRate float64 `json:"failure_rate"`
	Total       int     `json:"total"`
}

type Aggregator struct {
	mu sync.Mutex

	latencies []float64

	totalRequests int
	failedRequests int

	windowStart time.Time
}

func NewAggregator() *Aggregator {
	return &Aggregator{
		windowStart: time.Now(),
	}
}

func (a *Aggregator) AddMetric(
	latency float64,
	success bool,
) {

	a.mu.Lock()
	defer a.mu.Unlock()

	a.latencies = append(a.latencies, latency)

	a.totalRequests++

	if !success {
		a.failedRequests++
	}
}

func (a *Aggregator) Snapshot() MetricsSnapshot {

	a.mu.Lock()
	defer a.mu.Unlock()

	duration := time.Since(a.windowStart).Seconds()

	tps := float64(a.totalRequests) / duration

	p50 := percentile(a.latencies, 50)
	p90 := percentile(a.latencies, 90)
	p99 := percentile(a.latencies, 99)

	failureRate := 0.0

	if a.totalRequests > 0 {
		failureRate =
			float64(a.failedRequests) /
				float64(a.totalRequests) * 100
	}

	return MetricsSnapshot{
		TPS:         tps,
		P50:         p50,
		P90:         p90,
		P99:         p99,
		FailureRate: failureRate,
		Total:       a.totalRequests,
	}
}

func percentile(data []float64, p float64) float64 {

	if len(data) == 0 {
		return 0
	}

	copyData := make([]float64, len(data))

	copy(copyData, data)

	sort.Float64s(copyData)

	index := int(float64(len(copyData)-1) * p / 100)

	return copyData[index]
}