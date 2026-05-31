package repository

import (
	"database/sql"
	"encoding/json"
	"log"

	"github.com/RohitChavan16/IICPC_BenchForge/services/benchmark-service/internal/model"
)

func ListBenchmarks(db *sql.DB, limit int) ([]model.Benchmark, error) {
	rows, err := db.Query(`SELECT id, name, deployment_id, status, worker_count, started_at, finished_at, duration_seconds, total_requests, success_count, failure_count, p50, p90, p99, metadata, created_at, updated_at FROM benchmarks ORDER BY created_at DESC LIMIT $1`, limit)
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
		if err := rows.Scan(&b.ID, &b.Name, &b.DeploymentID, &b.Status, &b.WorkerCount, &b.StartedAt, &finished, &duration, &b.TotalRequests, &b.SuccessCount, &b.FailureCount, &b.P50, &b.P90, &b.P99, &meta, &b.CreatedAt, &b.UpdatedAt); err != nil {
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
		items = append(items, b)
	}
	return items, nil
}

func GetBenchmarkByID(db *sql.DB, id string) (*model.Benchmark, error) {
	row := db.QueryRow(`SELECT id, name, deployment_id, status, worker_count, started_at, finished_at, duration_seconds, total_requests, success_count, failure_count, p50, p90, p99, metadata, created_at, updated_at FROM benchmarks WHERE id=$1`, id)
	var b model.Benchmark
	var meta sql.NullString
	var finished sql.NullTime
	var duration sql.NullInt64
	if err := row.Scan(&b.ID, &b.Name, &b.DeploymentID, &b.Status, &b.WorkerCount, &b.StartedAt, &finished, &duration, &b.TotalRequests, &b.SuccessCount, &b.FailureCount, &b.P50, &b.P90, &b.P99, &meta, &b.CreatedAt, &b.UpdatedAt); err != nil {
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
	return &b, nil
}

func CreateBenchmark(db *sql.DB, name string, deploymentID string, workerCount int, metadata json.RawMessage) (*model.Benchmark, error) {
	var b model.Benchmark
	// Insert and return full row
	query := `INSERT INTO benchmarks (name, deployment_id, status, worker_count, metadata, started_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, now(), now(), now()) RETURNING id, name, deployment_id, status, worker_count, started_at, finished_at, duration_seconds, total_requests, success_count, failure_count, p50, p90, p99, metadata, created_at, updated_at`
	row := db.QueryRow(query, name, deploymentID, "CREATED", workerCount, string(metadata))
	var meta sql.NullString
	var finished sql.NullTime
	var duration sql.NullInt64
	if err := row.Scan(&b.ID, &b.Name, &b.DeploymentID, &b.Status, &b.WorkerCount, &b.StartedAt, &finished, &duration, &b.TotalRequests, &b.SuccessCount, &b.FailureCount, &b.P50, &b.P90, &b.P99, &meta, &b.CreatedAt, &b.UpdatedAt); err != nil {
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
	return &b, nil
}

func UpdateBenchmarkStatus(db *sql.DB, id string, status string, totalRequests int64, successCount int64, failureCount int64, p50, p90, p99 float64) (*model.Benchmark, error) {
	query := `UPDATE benchmarks SET status=$1, total_requests=$2, success_count=$3, failure_count=$4, p50=$5, p90=$6, p99=$7, finished_at=CASE WHEN $1 IN ('COMPLETED','FAILED') THEN now() ELSE finished_at END, duration_seconds=CASE WHEN $1 IN ('COMPLETED','FAILED') THEN EXTRACT(EPOCH FROM (now()-started_at))::int ELSE duration_seconds END, updated_at=now() WHERE id=$8 RETURNING id, name, deployment_id, status, worker_count, started_at, finished_at, duration_seconds, total_requests, success_count, failure_count, p50, p90, p99, metadata, created_at, updated_at`
	row := db.QueryRow(query, status, totalRequests, successCount, failureCount, p50, p90, p99, id)
	var b model.Benchmark
	var meta sql.NullString
	var finished sql.NullTime
	var duration sql.NullInt64
	if err := row.Scan(&b.ID, &b.Name, &b.DeploymentID, &b.Status, &b.WorkerCount, &b.StartedAt, &finished, &duration, &b.TotalRequests, &b.SuccessCount, &b.FailureCount, &b.P50, &b.P90, &b.P99, &meta, &b.CreatedAt, &b.UpdatedAt); err != nil {
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
	return &b, nil
}
