package model

import (
	"encoding/json"
	"time"
)

type Benchmark struct {
	ID               string          `json:"id"`
	Name             string          `json:"name"`
	UserID           string          `json:"userId"`
	TeamID           string          `json:"teamId"`
	TeamName         string          `json:"teamName"`
	SubmissionID     string          `json:"submissionId,omitempty"`
	DeploymentID     string          `json:"deploymentId,omitempty"`
	TargetType       string          `json:"targetType"`
	Status           string          `json:"status"`
	WorkerCount      int             `json:"workerCount"`
	TotalJobs        int             `json:"totalJobs"`
	StartedAt        time.Time       `json:"startedAt"`
	FinishedAt    *time.Time      `json:"finishedAt,omitempty"`
	Duration      *int            `json:"duration,omitempty"`
	TotalRequests int64           `json:"totalRequests"`
	SuccessCount  int64           `json:"successCount"`
	FailureCount  int64           `json:"failureCount"`
	P50           float64         `json:"p50"`
	P90              float64         `json:"p90"`
	P99              float64         `json:"p99"`
	CorrectnessScore float64         `json:"correctnessScore"`
	TracerTotal      int64           `json:"tracerTotal"`
	TracerSuccess    int64           `json:"tracerSuccess"`
	Metadata         json.RawMessage `json:"metadata,omitempty"`
	QueuePosition    int             `json:"queuePosition,omitempty"`
	LastHeartbeat    *time.Time      `json:"lastHeartbeat,omitempty"`
	FailureReason    string          `json:"failureReason,omitempty"`
	WaitTimeSeconds  *int            `json:"waitTimeSeconds,omitempty"`
	ExecutionTimeSeconds *int        `json:"executionTimeSeconds,omitempty"`
	CreatedAt        time.Time       `json:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt"`
}
