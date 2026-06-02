package model

import "time"

type Submission struct {
	ID             string    `json:"id"`
	UserID         string    `json:"userId"`
	TeamID         string    `json:"teamId"`
	TeamName       string    `json:"teamName"`
	SubmissionName string    `json:"submissionName"`
	Language       string    `json:"language"`
	FilePath       string    `json:"filePath"`
	Status         string    `json:"status"`
	BuildLog       string    `json:"buildLog,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
