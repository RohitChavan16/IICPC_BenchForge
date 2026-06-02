package repository

import (
	"database/sql"
	"encoding/json"
	"log"

	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/model"
)

func ListBenchmarks(db *sql.DB, limit int) ([]model.Benchmark, error) {
	rows, err := db.Query(`SELECT id, name, user_id, team_id, team_name, submission_id, deployment_id, target_type, status, worker_count, total_jobs, started_at, finished_at, duration_seconds, total_requests, success_count, failure_count, p50, p90, p99, correctness_score, metadata, created_at, updated_at FROM benchmarks ORDER BY created_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []model.Benchmark{}
	for rows.Next() {
		var b model.Benchmark
		var meta sql.NullString
		var finished sql.NullTime
		var duration sql.NullInt64
		var submissionID, deploymentID, userID, teamID, teamName, targetType sql.NullString
		var p50, p90, p99, correctnessScore sql.NullFloat64
		
		if err := rows.Scan(&b.ID, &b.Name, &userID, &teamID, &teamName, &submissionID, &deploymentID, &targetType, &b.Status, &b.WorkerCount, &b.TotalJobs, &b.StartedAt, &finished, &duration, &b.TotalRequests, &b.SuccessCount, &b.FailureCount, &p50, &p90, &p99, &correctnessScore, &meta, &b.CreatedAt, &b.UpdatedAt); err != nil {
			log.Printf("row scan error: %v", err)
			continue
		}
		if finished.Valid {
			b.FinishedAt = &finished.Time
		}
		if duration.Valid {
			d := int(duration.Int64)
			b.Duration = &d
		}
		if meta.Valid {
			b.Metadata = json.RawMessage(meta.String)
		}
		if userID.Valid { b.UserID = userID.String }
		if teamID.Valid { b.TeamID = teamID.String }
		if teamName.Valid { b.TeamName = teamName.String }
		if submissionID.Valid { b.SubmissionID = submissionID.String }
		if deploymentID.Valid { b.DeploymentID = deploymentID.String }
		if targetType.Valid { b.TargetType = targetType.String }
		if p50.Valid { b.P50 = p50.Float64 }
		if p90.Valid { b.P90 = p90.Float64 }
		if p99.Valid { b.P99 = p99.Float64 }
		if correctnessScore.Valid { b.CorrectnessScore = correctnessScore.Float64 }

		items = append(items, b)
	}
	return items, nil
}

func GetBenchmarkByID(db *sql.DB, id string) (*model.Benchmark, error) {
	row := db.QueryRow(`SELECT id, name, user_id, team_id, team_name, submission_id, deployment_id, target_type, status, worker_count, total_jobs, started_at, finished_at, duration_seconds, total_requests, success_count, failure_count, p50, p90, p99, correctness_score, metadata, created_at, updated_at FROM benchmarks WHERE id=$1`, id)
	var b model.Benchmark
	var meta sql.NullString
	var finished sql.NullTime
	var duration sql.NullInt64
	var submissionID, deploymentID, userID, teamID, teamName, targetType sql.NullString
	var p50, p90, p99, correctnessScore sql.NullFloat64

	if err := row.Scan(&b.ID, &b.Name, &userID, &teamID, &teamName, &submissionID, &deploymentID, &targetType, &b.Status, &b.WorkerCount, &b.TotalJobs, &b.StartedAt, &finished, &duration, &b.TotalRequests, &b.SuccessCount, &b.FailureCount, &p50, &p90, &p99, &correctnessScore, &meta, &b.CreatedAt, &b.UpdatedAt); err != nil {
		return nil, err
	}
	if finished.Valid {
		b.FinishedAt = &finished.Time
	}
	if duration.Valid {
		d := int(duration.Int64)
		b.Duration = &d
	}
	if meta.Valid {
		b.Metadata = json.RawMessage(meta.String)
	}
	if userID.Valid { b.UserID = userID.String }
	if teamID.Valid { b.TeamID = teamID.String }
	if teamName.Valid { b.TeamName = teamName.String }
	if submissionID.Valid { b.SubmissionID = submissionID.String }
	if deploymentID.Valid { b.DeploymentID = deploymentID.String }
	if targetType.Valid { b.TargetType = targetType.String }
	if p50.Valid { b.P50 = p50.Float64 }
	if p90.Valid { b.P90 = p90.Float64 }
	if p99.Valid { b.P99 = p99.Float64 }
	if correctnessScore.Valid { b.CorrectnessScore = correctnessScore.Float64 }
	return &b, nil
}

func CreateBenchmark(db *sql.DB, name string, userID string, teamID string, teamName string, submissionID string, deploymentID string, targetType string, workerCount int, totalJobs int, metadata json.RawMessage) (*model.Benchmark, error) {
	var b model.Benchmark
	
	var dbSubID interface{} = nil
	if submissionID != "" { dbSubID = submissionID }
	
	var dbDepID interface{} = nil
	if deploymentID != "" { dbDepID = deploymentID }

	var metaVal interface{} = nil
	if len(metadata) > 0 {
		metaVal = string(metadata)
	}

	query := `INSERT INTO benchmarks (name, user_id, team_id, team_name, submission_id, deployment_id, target_type, status, worker_count, total_jobs, metadata, started_at, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now(), now()) 
	          RETURNING id, name, user_id, team_id, team_name, submission_id, deployment_id, target_type, status, worker_count, total_jobs, started_at, finished_at, duration_seconds, total_requests, success_count, failure_count, p50, p90, p99, correctness_score, metadata, created_at, updated_at`
	
	row := db.QueryRow(query, name, userID, teamID, teamName, dbSubID, dbDepID, targetType, "CREATED", workerCount, totalJobs, metaVal)
	var meta sql.NullString
	var finished sql.NullTime
	var duration sql.NullInt64
	var rSubID, rDepID, rUserID, rTeamID, rTeamName, rTargetType sql.NullString
	var p50, p90, p99, correctnessScore sql.NullFloat64

	if err := row.Scan(&b.ID, &b.Name, &rUserID, &rTeamID, &rTeamName, &rSubID, &rDepID, &rTargetType, &b.Status, &b.WorkerCount, &b.TotalJobs, &b.StartedAt, &finished, &duration, &b.TotalRequests, &b.SuccessCount, &b.FailureCount, &p50, &p90, &p99, &correctnessScore, &meta, &b.CreatedAt, &b.UpdatedAt); err != nil {
		return nil, err
	}
	if finished.Valid {
		b.FinishedAt = &finished.Time
	}
	if duration.Valid {
		d := int(duration.Int64)
		b.Duration = &d
	}
	if meta.Valid {
		b.Metadata = json.RawMessage(meta.String)
	}
	if rUserID.Valid { b.UserID = rUserID.String }
	if rTeamID.Valid { b.TeamID = rTeamID.String }
	if rTeamName.Valid { b.TeamName = rTeamName.String }
	if rSubID.Valid { b.SubmissionID = rSubID.String }
	if rDepID.Valid { b.DeploymentID = rDepID.String }
	if rTargetType.Valid { b.TargetType = rTargetType.String }
	if p50.Valid { b.P50 = p50.Float64 }
	if p90.Valid { b.P90 = p90.Float64 }
	if p99.Valid { b.P99 = p99.Float64 }
	if correctnessScore.Valid { b.CorrectnessScore = correctnessScore.Float64 }
	
	return &b, nil
}

func UpdateBenchmarkStatus(db *sql.DB, id string, status string, totalRequests int64, successCount int64, failureCount int64, p50, p90, p99 float64) (*model.Benchmark, error) {
	query := `UPDATE benchmarks SET status=$1, total_requests=$2, success_count=$3, failure_count=$4, p50=$5, p90=$6, p99=$7, finished_at=CASE WHEN $1 IN ('COMPLETED','FAILED','CANCELLED') THEN now() ELSE finished_at END, duration_seconds=CASE WHEN $1 IN ('COMPLETED','FAILED','CANCELLED') THEN EXTRACT(EPOCH FROM (now()-started_at))::int ELSE duration_seconds END, updated_at=now() WHERE id=$8 RETURNING id, name, user_id, team_id, team_name, submission_id, deployment_id, target_type, status, worker_count, total_jobs, started_at, finished_at, duration_seconds, total_requests, success_count, failure_count, p50, p90, p99, correctness_score, metadata, created_at, updated_at`
	row := db.QueryRow(query, status, totalRequests, successCount, failureCount, p50, p90, p99, id)
	var b model.Benchmark
	var meta sql.NullString
	var finished sql.NullTime
	var duration sql.NullInt64
	var rSubID, rDepID, rUserID, rTeamID, rTeamName, rTargetType sql.NullString
	var rP50, rP90, rP99, correctnessScore sql.NullFloat64

	if err := row.Scan(&b.ID, &b.Name, &rUserID, &rTeamID, &rTeamName, &rSubID, &rDepID, &rTargetType, &b.Status, &b.WorkerCount, &b.TotalJobs, &b.StartedAt, &finished, &duration, &b.TotalRequests, &b.SuccessCount, &b.FailureCount, &rP50, &rP90, &rP99, &correctnessScore, &meta, &b.CreatedAt, &b.UpdatedAt); err != nil {
		return nil, err
	}
	if finished.Valid {
		b.FinishedAt = &finished.Time
	}
	if duration.Valid {
		d := int(duration.Int64)
		b.Duration = &d
	}
	if meta.Valid {
		b.Metadata = json.RawMessage(meta.String)
	}
	if rUserID.Valid { b.UserID = rUserID.String }
	if rTeamID.Valid { b.TeamID = rTeamID.String }
	if rTeamName.Valid { b.TeamName = rTeamName.String }
	if rSubID.Valid { b.SubmissionID = rSubID.String }
	if rDepID.Valid { b.DeploymentID = rDepID.String }
	if rTargetType.Valid { b.TargetType = rTargetType.String }
	if rP50.Valid { b.P50 = rP50.Float64 }
	if rP90.Valid { b.P90 = rP90.Float64 }
	if rP99.Valid { b.P99 = rP99.Float64 }
	if correctnessScore.Valid { b.CorrectnessScore = correctnessScore.Float64 }
	return &b, nil
}
