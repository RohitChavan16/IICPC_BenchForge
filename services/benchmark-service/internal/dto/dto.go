package dto

import "encoding/json"

type CreateBenchmarkRequest struct {
	Name          string          `json:"name"`
	UserID        string          `json:"userId"`
	TeamID        string          `json:"teamId"`
	TeamName      string          `json:"teamName"`
	SubmissionID  string          `json:"submissionId,omitempty"`
	DeploymentID  string          `json:"deploymentId,omitempty"`
	TargetType    string          `json:"targetType"` // "mock" or "deployment"
	WorkerCount   int             `json:"workerCount"`
	TotalRequests int             `json:"totalRequests"`
	Metadata      json.RawMessage `json:"metadata,omitempty"`
}

type UpdateStatusRequest struct {
	Status        string  `json:"status"`
	TotalRequests int64   `json:"totalRequests"`
	SuccessCount  int64   `json:"successCount"`
	FailureCount  int64   `json:"failureCount"`
	P50           float64 `json:"p50"`
	P90           float64 `json:"p90"`
	P99           float64 `json:"p99"`
	TracerTotal   int64   `json:"tracerTotal"`
	TracerSuccess int64   `json:"tracerSuccess"`
	FailureReason string  `json:"failureReason,omitempty"`
}

type BenchmarkResponse struct {
	// Let's check model.Benchmark first.
}
