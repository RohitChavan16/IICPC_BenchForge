package main

import (
    "encoding/json"
)

type CreateBenchmarkRequest struct {
    Name        string          `json:"name"`
    WorkerCount int             `json:"workerCount"`
    Metadata    json.RawMessage `json:"metadata,omitempty"`
}

type UpdateStatusRequest struct {
    Status        string  `json:"status"`
    TotalRequests int64   `json:"totalRequests"`
    SuccessCount  int64   `json:"successCount"`
    FailureCount  int64   `json:"failureCount"`
    P50           float64 `json:"p50"`
    P90           float64 `json:"p90"`
    P99           float64 `json:"p99"`
}
