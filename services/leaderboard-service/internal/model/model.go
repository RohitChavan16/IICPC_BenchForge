package model

import "time"

type LeaderboardEntry struct {
	ID             string    `json:"id"`
	BenchmarkID    string    `json:"benchmarkId"`
	TeamName       string    `json:"teamName"`
	SubmissionName string    `json:"submissionName"`
	DeploymentID   string    `json:"deploymentId"`
	TPS            float64   `json:"tps"`
	SuccessRate    float64   `json:"successRate"`
	P50            float64   `json:"p50"`
	P90            float64   `json:"p90"`
	P99            float64   `json:"p99"`
	TotalRequests    int64     `json:"totalRequests"`
	Duration         int       `json:"duration"`
	CorrectnessScore float64   `json:"correctnessScore"`
	FinalScore       float64   `json:"finalScore"`
	Rank           int       `json:"rank"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
