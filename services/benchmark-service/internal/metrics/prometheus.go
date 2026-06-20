package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	HttpRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "http_requests_total",
		Help: "Total number of HTTP requests processed by benchmark service",
	}, []string{"method", "path", "status"})

	HttpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "http_request_duration_seconds",
		Help:    "Duration of HTTP requests in seconds",
		Buckets: prometheus.DefBuckets,
	}, []string{"method", "path"})

	BenchmarksRunning = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "benchmarks_running",
		Help: "Current number of running benchmarks",
	})
	
	BenchmarksCompleted = promauto.NewCounter(prometheus.CounterOpts{
		Name: "benchmarks_completed",
		Help: "Total number of completed benchmarks",
	})

	BenchmarksFailed = promauto.NewCounter(prometheus.CounterOpts{
		Name: "benchmarks_failed",
		Help: "Total number of failed benchmarks",
	})
)

