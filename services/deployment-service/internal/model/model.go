package model

import "time"

type Deployment struct {
	ID               string     `json:"id"`
	SubmissionID     string     `json:"submissionId"`
	ContainerID      string     `json:"containerId,omitempty"`
	ContainerImage   string     `json:"containerImage,omitempty"`
	HostPort         *int       `json:"hostPort,omitempty"`
	ContainerPort    int        `json:"containerPort"`
	DeploymentStatus string     `json:"deploymentStatus"`
	DeploymentLog    string     `json:"deploymentLog,omitempty"`
	DeployedAt       *time.Time `json:"deployedAt,omitempty"`
	StoppedAt        *time.Time `json:"stoppedAt,omitempty"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}
