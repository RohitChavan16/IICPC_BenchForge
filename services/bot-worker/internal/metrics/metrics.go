package metrics

import "time"

type RequestMetric struct {
	RequestID    string            `json:"request_id"`
	TraceID      string            `json:"trace_id"`
	TraceContext map[string]string `json:"trace_context"`
	BotType      string            `json:"bot_type"`
	WorkerID     string            `json:"worker_id"`
	BenchmarkID  string            `json:"benchmark_id"`
	Latency      time.Duration     `json:"latency"`
	Success      bool              `json:"success"`
	StatusCode   int               `json:"status_code"`
	Timestamp    time.Time         `json:"timestamp"`
	Token        string            `json:"token"`
}