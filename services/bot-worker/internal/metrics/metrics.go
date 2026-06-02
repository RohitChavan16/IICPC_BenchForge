package metrics

import "time"

type RequestMetric struct {
	RequestID   string        `json:"request_id"`
	BotType     string        `json:"bot_type"`
	WorkerID    string        `json:"worker_id"`
	BenchmarkID string        `json:"benchmark_id"`
	Latency     time.Duration `json:"latency"`
	Success   bool          `json:"success"`
	StatusCode int          `json:"status_code"`
	Timestamp time.Time     `json:"timestamp"`
}