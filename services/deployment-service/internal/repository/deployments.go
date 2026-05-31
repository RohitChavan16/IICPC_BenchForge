package repository

import (
	"database/sql"

	"github.com/RohitChavan16/IICPC_BenchForge/services/deployment-service/internal/model"
)

func CreateDeployment(db *sql.DB, submissionID string, containerPort int) (*model.Deployment, error) {
	query := `INSERT INTO deployments (submission_id, container_port, deployment_status, created_at, updated_at) VALUES ($1, $2, 'PENDING', now(), now()) RETURNING id, submission_id, container_id, container_image, host_port, container_port, deployment_status, deployment_log, deployed_at, stopped_at, created_at, updated_at`
	row := db.QueryRow(query, submissionID, containerPort)
	var d model.Deployment
	var hostPort sql.NullInt64
	var deployedAt sql.NullTime
	var stoppedAt sql.NullTime
	var containerID sql.NullString
	var containerImage sql.NullString
	var deploymentLog sql.NullString
	if err := row.Scan(&d.ID, &d.SubmissionID, &containerID, &containerImage, &hostPort, &d.ContainerPort, &d.DeploymentStatus, &deploymentLog, &deployedAt, &stoppedAt, &d.CreatedAt, &d.UpdatedAt); err != nil {
		return nil, err
	}
	if containerID.Valid {
		d.ContainerID = containerID.String
	}
	if containerImage.Valid {
		d.ContainerImage = containerImage.String
	}
	if deploymentLog.Valid {
		d.DeploymentLog = deploymentLog.String
	}
	if hostPort.Valid {
		hp := int(hostPort.Int64)
		d.HostPort = &hp
	}
	if deployedAt.Valid {
		d.DeployedAt = &deployedAt.Time
	}
	if stoppedAt.Valid {
		d.StoppedAt = &stoppedAt.Time
	}
	return &d, nil
}

func GetDeploymentByID(db *sql.DB, id string) (*model.Deployment, error) {
	row := db.QueryRow(`SELECT id, submission_id, container_id, container_image, host_port, container_port, deployment_status, deployment_log, deployed_at, stopped_at, created_at, updated_at FROM deployments WHERE id=$1`, id)
	var d model.Deployment
	var hostPort sql.NullInt64
	var deployedAt sql.NullTime
	var stoppedAt sql.NullTime
	var containerID sql.NullString
	var containerImage sql.NullString
	var deploymentLog sql.NullString
	if err := row.Scan(&d.ID, &d.SubmissionID, &containerID, &containerImage, &hostPort, &d.ContainerPort, &d.DeploymentStatus, &deploymentLog, &deployedAt, &stoppedAt, &d.CreatedAt, &d.UpdatedAt); err != nil {
		return nil, err
	}
	if containerID.Valid {
		d.ContainerID = containerID.String
	}
	if containerImage.Valid {
		d.ContainerImage = containerImage.String
	}
	if deploymentLog.Valid {
		d.DeploymentLog = deploymentLog.String
	}
	if hostPort.Valid {
		hp := int(hostPort.Int64)
		d.HostPort = &hp
	}
	if deployedAt.Valid {
		d.DeployedAt = &deployedAt.Time
	}
	if stoppedAt.Valid {
		d.StoppedAt = &stoppedAt.Time
	}
	return &d, nil
}

func ListDeployments(db *sql.DB, limit int) ([]model.Deployment, error) {
	rows, err := db.Query(`SELECT id, submission_id, container_id, container_image, host_port, container_port, deployment_status, deployment_log, deployed_at, stopped_at, created_at, updated_at FROM deployments ORDER BY created_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []model.Deployment
	for rows.Next() {
		var d model.Deployment
		var hostPort sql.NullInt64
		var deployedAt sql.NullTime
		var stoppedAt sql.NullTime
		var containerID sql.NullString
		var containerImage sql.NullString
		var deploymentLog sql.NullString
		if err := rows.Scan(&d.ID, &d.SubmissionID, &containerID, &containerImage, &hostPort, &d.ContainerPort, &d.DeploymentStatus, &deploymentLog, &deployedAt, &stoppedAt, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, err
		}
		if containerID.Valid {
			d.ContainerID = containerID.String
		}
		if containerImage.Valid {
			d.ContainerImage = containerImage.String
		}
		if deploymentLog.Valid {
			d.DeploymentLog = deploymentLog.String
		}
		if hostPort.Valid {
			hp := int(hostPort.Int64)
			d.HostPort = &hp
		}
		if deployedAt.Valid {
			d.DeployedAt = &deployedAt.Time
		}
		if stoppedAt.Valid {
			d.StoppedAt = &stoppedAt.Time
		}
		items = append(items, d)
	}
	return items, rows.Err()
}

func UpdateDeployment(db *sql.DB, id, containerID, containerImage string, hostPort int, status string) error {
	_, err := db.Exec(`UPDATE deployments SET container_id=$1, container_image=$2, host_port=$3, deployment_status=$4, deployed_at=CASE WHEN $4='RUNNING' THEN now() ELSE deployed_at END, updated_at=now() WHERE id=$5`, containerID, containerImage, hostPort, status, id)
	return err
}

func StopDeployment(db *sql.DB, id string, status string) error {
	_, err := db.Exec(`UPDATE deployments SET deployment_status=$1, stopped_at=now(), updated_at=now() WHERE id=$2`, status, id)
	return err
}

func AppendDeploymentLog(db *sql.DB, id string, logData string) error {
	_, err := db.Exec(`UPDATE deployments SET deployment_log = COALESCE(deployment_log || E'\n\n', '') || $1, updated_at=now() WHERE id=$2`, logData, id)
	return err
}

func IsPortInUse(db *sql.DB, port int) (bool, error) {
	var exists bool
	err := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM deployments WHERE host_port=$1 AND deployment_status IN ('DEPLOYING','RUNNING'))`, port).Scan(&exists)
	return exists, err
}
