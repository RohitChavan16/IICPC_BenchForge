package model

import "time"

type Submission struct {
	ID             string     `json:"id"`
	UserID         string     `json:"userId"`
	TeamID         string     `json:"teamId"`
	TeamName       string     `json:"teamName"`
	SubmissionName string     `json:"submissionName"`
	Language       string     `json:"language"`
	FilePath       string     `json:"filePath"`
	Status         string     `json:"status"`
	CurrentStage   string     `json:"currentStage,omitempty"`
	StageStatus    string     `json:"stageStatus,omitempty"`
	FailureReason  string     `json:"failureReason,omitempty"`
	BuildLog       string     `json:"buildLog,omitempty"`
	StartedAt      *time.Time `json:"startedAt,omitempty"`
	FinishedAt     *time.Time `json:"finishedAt,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}
