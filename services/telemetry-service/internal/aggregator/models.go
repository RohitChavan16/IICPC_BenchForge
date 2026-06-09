package aggregator

type ReplayData struct {
	BenchmarkID    string             `json:"benchmark_id"`
	Status         string             `json:"status"`
	FailureReason  *string            `json:"failure_reason"`
	LifecycleEvents []LifecycleEvent   `json:"lifecycle_events"`
	Snapshots      []ReplaySnapshot   `json:"snapshots"`
	Insights       []ReplayInsight    `json:"insights"`
}

type LifecycleEvent struct {
	Phase     string `json:"phase"`
	Timestamp string `json:"timestamp"`
	Status    string `json:"status"`
}

type ReplaySnapshot struct {
	ProgressPercent     int                       `json:"progress_percent"`
	TPS                 int                       `json:"tps"`
	P50                 int64                     `json:"p50"`
	P90                 int64                     `json:"p90"`
	P99                 int64                     `json:"p99"`
	SuccessRate         int                       `json:"success_rate"`
	RequestsProcessed   int                       `json:"requests_processed"`
	RequestsRemaining   int                       `json:"requests_remaining"`
	PersonaDistribution map[string]int            `json:"persona_distribution"`
	PersonaMetrics      map[string]PersonaMetrics `json:"persona_metrics"`
}

type PersonaMetrics struct {
	TPS int   `json:"tps"`
	P99 int64 `json:"p99"`
}

type ReplayInsight struct {
	BucketIndex int    `json:"bucket_index"`
	Type        string `json:"type"`
	Message     string `json:"message"`
}
