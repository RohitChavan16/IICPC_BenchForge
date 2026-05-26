package metrics

import "github.com/prometheus/client_golang/prometheus"

var (

	HTTPRequestCounter = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total HTTP requests",
		},
		[]string{"method", "path", "status"},
	)

	HTTPRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request latency",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path"},
	)

	ActiveRequests = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "active_requests",
			Help: "Current active requests",
		},
	)
)

func Init() {

	prometheus.MustRegister(
		HTTPRequestCounter,
		HTTPRequestDuration,
		ActiveRequests,
	)
}