package main

import (
    "encoding/json"
    "time"
)

type Benchmark struct {
    ID            string          `json:"id"`
    Name          string          `json:"name"`
    Status        string          `json:"status"`
    WorkerCount   int             `json:"workerCount"`
    StartedAt     time.Time       `json:"startedAt"`
    FinishedAt    *time.Time      `json:"finishedAt,omitempty"`
    Duration      *int            `json:"duration,omitempty"`
    TotalRequests int64           `json:"totalRequests"`
    SuccessCount  int64           `json:"successCount"`
    FailureCount  int64           `json:"failureCount"`
    P50           float64         `json:"p50"`
    P90           float64         `json:"p90"`
    P99           float64         `json:"p99"`
    Metadata      json.RawMessage `json:"metadata,omitempty"`
    CreatedAt     time.Time       `json:"createdAt"`
    UpdatedAt     time.Time       `json:"updatedAt"`
}
