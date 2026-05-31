package model

import "time"

type Submission struct {
	ID             string    `json:"id"`
	TeamName       string    `json:"teamName"`
	SubmissionName string    `json:"submissionName"`
	Language       string    `json:"language"`
	FilePath       string    `json:"filePath"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
