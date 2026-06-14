package repository

import (
	"database/sql"
	"encoding/json"
	"log"

	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/model"
)

func ListBenchmarks(db *sql.DB, limit int, userID string) ([]model.Benchmark, error) {
	query := `SELECT id, name, user_id, team_id, team_name, submission_id, deployment_id, target_type, status, worker_count, total_jobs, started_at, finished_at, duration_seconds, total_requests, success_count, failure_count, p50, p90, p99, correctness_score, tracer_total, tracer_success, metadata, last_heartbeat, failure_reason, wait_time_seconds, execution_time_seconds, created_at, updated_at,
	          (CASE WHEN status = 'QUEUED' THEN (SELECT COUNT(*) + 1 FROM benchmarks b2 WHERE b2.status = 'QUEUED' AND b2.created_at < benchmarks.created_at) ELSE 0 END) as queue_position
	          FROM benchmarks`
	
	var rows *sql.Rows
	var err error

	if userID != "" {
		query += ` WHERE user_id = $2 ORDER BY created_at DESC LIMIT $1`
		rows, err = db.Query(query, limit, userID)
	} else {
		query += ` ORDER BY created_at DESC LIMIT $1`
		rows, err = db.Query(query, limit)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := []model.Benchmark{}
	for rows.Next() {
		var b model.Benchmark
		var meta, failureReason sql.NullString
		var finished, lastHeartbeat sql.NullTime
		var duration, waitTime, execTime sql.NullInt64
		var submissionID, deploymentID, userID, teamID, teamName, targetType sql.NullString
		var p50, p90, p99, correctnessScore sql.NullFloat64
		
		if err := rows.Scan(&b.ID, &b.Name, &userID, &teamID, &teamName, &submissionID, &deploymentID, &targetType, &b.Status, &b.WorkerCount, &b.TotalJobs, &b.StartedAt, &finished, &duration, &b.TotalRequests, &b.SuccessCount, &b.FailureCount, &p50, &p90, &p99, &correctnessScore, &b.TracerTotal, &b.TracerSuccess, &meta, &lastHeartbeat, &failureReason, &waitTime, &execTime, &b.CreatedAt, &b.UpdatedAt, &b.QueuePosition); err != nil {
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
		if waitTime.Valid {
			w := int(waitTime.Int64)
			b.WaitTimeSeconds = &w
		}
		if execTime.Valid {
			e := int(execTime.Int64)
			b.ExecutionTimeSeconds = &e
		}
		if lastHeartbeat.Valid {
			b.LastHeartbeat = &lastHeartbeat.Time
		}
		if failureReason.Valid {
			b.FailureReason = failureReason.String
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
	query := `SELECT id, name, user_id, team_id, team_name, submission_id, deployment_id, target_type, status, worker_count, total_jobs, started_at, finished_at, duration_seconds, total_requests, success_count, failure_count, p50, p90, p99, correctness_score, tracer_total, tracer_success, metadata, last_heartbeat, failure_reason, wait_time_seconds, execution_time_seconds, created_at, updated_at,
	          (CASE WHEN status = 'QUEUED' THEN (SELECT COUNT(*) + 1 FROM benchmarks b2 WHERE b2.status = 'QUEUED' AND b2.created_at < benchmarks.created_at) ELSE 0 END) as queue_position
	          FROM benchmarks WHERE id=$1`
	row := db.QueryRow(query, id)
	var b model.Benchmark
	var meta, failureReason sql.NullString
	var finished, lastHeartbeat sql.NullTime
	var duration, waitTime, execTime sql.NullInt64
	var submissionID, deploymentID, userID, teamID, teamName, targetType sql.NullString
	var p50, p90, p99, correctnessScore sql.NullFloat64

	if err := row.Scan(&b.ID, &b.Name, &userID, &teamID, &teamName, &submissionID, &deploymentID, &targetType, &b.Status, &b.WorkerCount, &b.TotalJobs, &b.StartedAt, &finished, &duration, &b.TotalRequests, &b.SuccessCount, &b.FailureCount, &p50, &p90, &p99, &correctnessScore, &b.TracerTotal, &b.TracerSuccess, &meta, &lastHeartbeat, &failureReason, &waitTime, &execTime, &b.CreatedAt, &b.UpdatedAt, &b.QueuePosition); err != nil {
		return nil, err
	}
		if finished.Valid {
		b.FinishedAt = &finished.Time
	}
	if duration.Valid {
		d := int(duration.Int64)
		b.Duration = &d
	}
	if waitTime.Valid {
		w := int(waitTime.Int64)
		b.WaitTimeSeconds = &w
	}
	if execTime.Valid {
		e := int(execTime.Int64)
		b.ExecutionTimeSeconds = &e
	}
	if lastHeartbeat.Valid {
		b.LastHeartbeat = &lastHeartbeat.Time
	}
	if failureReason.Valid {
		b.FailureReason = failureReason.String
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
	          RETURNING id, name, user_id, team_id, team_name, submission_id, deployment_id, target_type, status, worker_count, total_jobs, started_at, finished_at, duration_seconds, total_requests, success_count, failure_count, p50, p90, p99, correctness_score, tracer_total, tracer_success, metadata, last_heartbeat, failure_reason, wait_time_seconds, execution_time_seconds, created_at, updated_at,
	          (CASE WHEN status = 'QUEUED' THEN (SELECT COUNT(*) + 1 FROM benchmarks b2 WHERE b2.status = 'QUEUED' AND b2.created_at < benchmarks.created_at) ELSE 0 END) as queue_position`
	
	row := db.QueryRow(query, name, userID, teamID, teamName, dbSubID, dbDepID, targetType, "QUEUED", workerCount, totalJobs, metaVal)
	var meta, failureReason sql.NullString
	var finished, lastHeartbeat sql.NullTime
	var duration, waitTime, execTime sql.NullInt64
	var rSubID, rDepID, rUserID, rTeamID, rTeamName, rTargetType sql.NullString
	var p50, p90, p99, correctnessScore sql.NullFloat64

	if err := row.Scan(&b.ID, &b.Name, &rUserID, &rTeamID, &rTeamName, &rSubID, &rDepID, &rTargetType, &b.Status, &b.WorkerCount, &b.TotalJobs, &b.StartedAt, &finished, &duration, &b.TotalRequests, &b.SuccessCount, &b.FailureCount, &p50, &p90, &p99, &correctnessScore, &b.TracerTotal, &b.TracerSuccess, &meta, &lastHeartbeat, &failureReason, &waitTime, &execTime, &b.CreatedAt, &b.UpdatedAt, &b.QueuePosition); err != nil {
		return nil, err
	}
	if finished.Valid {
		b.FinishedAt = &finished.Time
	}
	if duration.Valid {
		d := int(duration.Int64)
		b.Duration = &d
	}
	if waitTime.Valid {
		w := int(waitTime.Int64)
		b.WaitTimeSeconds = &w
	}
	if execTime.Valid {
		e := int(execTime.Int64)
		b.ExecutionTimeSeconds = &e
	}
	if lastHeartbeat.Valid {
		b.LastHeartbeat = &lastHeartbeat.Time
	}
	if failureReason.Valid {
		b.FailureReason = failureReason.String
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

func UpdateBenchmarkStatus(db *sql.DB, id string, status string, totalRequests int64, successCount int64, failureCount int64, p50, p90, p99 float64, tracerTotal, tracerSuccess int64, failureReason string) (*model.Benchmark, error) {
	query := `UPDATE benchmarks SET status=$1, total_requests=$2, success_count=$3, failure_count=$4, p50=$5, p90=$6, p99=$7, 
	          failure_reason=COALESCE(NULLIF($10, ''), failure_reason),
	          finished_at=CASE WHEN $1 IN ('COMPLETED','FAILED','CANCELLED') THEN now() ELSE finished_at END, 
	          duration_seconds=CASE WHEN $1 IN ('COMPLETED','FAILED','CANCELLED') THEN EXTRACT(EPOCH FROM (now()-created_at))::int ELSE duration_seconds END, 
	          wait_time_seconds=CASE WHEN $1 IN ('COMPLETED','FAILED','CANCELLED') AND started_at IS NOT NULL THEN EXTRACT(EPOCH FROM (started_at-created_at))::int ELSE wait_time_seconds END,
	          execution_time_seconds=CASE WHEN $1 IN ('COMPLETED','FAILED','CANCELLED') AND started_at IS NOT NULL THEN EXTRACT(EPOCH FROM (now()-started_at))::int ELSE execution_time_seconds END,
	          updated_at=now(), tracer_total=$8, tracer_success=$9 WHERE id=$11
	          RETURNING id, name, user_id, team_id, team_name, submission_id, deployment_id, target_type, status, worker_count, total_jobs, started_at, finished_at, duration_seconds, total_requests, success_count, failure_count, p50, p90, p99, correctness_score, tracer_total, tracer_success, metadata, last_heartbeat, failure_reason, wait_time_seconds, execution_time_seconds, created_at, updated_at,
	          (CASE WHEN status = 'QUEUED' THEN (SELECT COUNT(*) + 1 FROM benchmarks b2 WHERE b2.status = 'QUEUED' AND b2.created_at < benchmarks.created_at) ELSE 0 END) as queue_position`
	row := db.QueryRow(query, status, totalRequests, successCount, failureCount, p50, p90, p99, tracerTotal, tracerSuccess, failureReason, id)
	var b model.Benchmark
	var meta, reason sql.NullString
	var finished, lastHeartbeat sql.NullTime
	var duration, waitTime, execTime sql.NullInt64
	var rSubID, rDepID, rUserID, rTeamID, rTeamName, rTargetType sql.NullString
	var rP50, rP90, rP99, correctnessScore sql.NullFloat64

	if err := row.Scan(&b.ID, &b.Name, &rUserID, &rTeamID, &rTeamName, &rSubID, &rDepID, &rTargetType, &b.Status, &b.WorkerCount, &b.TotalJobs, &b.StartedAt, &finished, &duration, &b.TotalRequests, &b.SuccessCount, &b.FailureCount, &rP50, &rP90, &rP99, &correctnessScore, &b.TracerTotal, &b.TracerSuccess, &meta, &lastHeartbeat, &reason, &waitTime, &execTime, &b.CreatedAt, &b.UpdatedAt, &b.QueuePosition); err != nil {
		return nil, err
	}
	if finished.Valid {
		b.FinishedAt = &finished.Time
	}
	if duration.Valid {
		d := int(duration.Int64)
		b.Duration = &d
	}
	if waitTime.Valid {
		w := int(waitTime.Int64)
		b.WaitTimeSeconds = &w
	}
	if execTime.Valid {
		e := int(execTime.Int64)
		b.ExecutionTimeSeconds = &e
	}
	if lastHeartbeat.Valid {
		b.LastHeartbeat = &lastHeartbeat.Time
	}
	if reason.Valid {
		b.FailureReason = reason.String
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

func CountRunningBenchmarks(db *sql.DB) (int, error) {
	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM benchmarks WHERE status = 'RUNNING'`).Scan(&count)
	return count, err
}

func DequeueNextBenchmark(db *sql.DB) (*model.Benchmark, error) {
	query := `UPDATE benchmarks
	          SET status = 'RUNNING', started_at = now(), last_heartbeat = now(), updated_at = now()
	          WHERE id = (
	              SELECT id FROM benchmarks 
	              WHERE status = 'QUEUED' 
	              ORDER BY created_at ASC 
	              LIMIT 1 
	              FOR UPDATE SKIP LOCKED
	          )
	          RETURNING id, name, user_id, team_id, team_name, submission_id, deployment_id, target_type, status, worker_count, total_jobs, started_at, finished_at, duration_seconds, total_requests, success_count, failure_count, p50, p90, p99, correctness_score, tracer_total, tracer_success, metadata, last_heartbeat, failure_reason, wait_time_seconds, execution_time_seconds, created_at, updated_at,
	          0 as queue_position`
	row := db.QueryRow(query)
	var b model.Benchmark
	var meta, failureReason sql.NullString
	var finished, lastHeartbeat sql.NullTime
	var duration, waitTime, execTime sql.NullInt64
	var submissionID, deploymentID, userID, teamID, teamName, targetType sql.NullString
	var p50, p90, p99, correctnessScore sql.NullFloat64

	if err := row.Scan(&b.ID, &b.Name, &userID, &teamID, &teamName, &submissionID, &deploymentID, &targetType, &b.Status, &b.WorkerCount, &b.TotalJobs, &b.StartedAt, &finished, &duration, &b.TotalRequests, &b.SuccessCount, &b.FailureCount, &p50, &p90, &p99, &correctnessScore, &b.TracerTotal, &b.TracerSuccess, &meta, &lastHeartbeat, &failureReason, &waitTime, &execTime, &b.CreatedAt, &b.UpdatedAt, &b.QueuePosition); err != nil {
		return nil, err
	}
	if finished.Valid { b.FinishedAt = &finished.Time }
	if duration.Valid { d := int(duration.Int64); b.Duration = &d }
	if meta.Valid { b.Metadata = json.RawMessage(meta.String) }
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
