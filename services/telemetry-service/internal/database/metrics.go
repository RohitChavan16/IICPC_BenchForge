package database

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Metric struct {
	RequestID   string
	BotType     string
	WorkerID    string
	BenchmarkID string
	Latency     int64
	Success     bool
}

func InsertMetric(
	db *pgxpool.Pool,
	metric Metric,
) (bool, error) {

	query := `
	INSERT INTO public.telemetry_metrics
	(request_id, bot_type, worker_id, benchmark_id, latency, success, created_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7)
	ON CONFLICT (request_id) DO NOTHING
	`

	res, err := db.Exec(
		context.Background(),
		query,
		metric.RequestID,
		metric.BotType,
		metric.WorkerID,
		metric.BenchmarkID,
		metric.Latency,
		metric.Success,
		time.Now(),
	)

	if err != nil {
		return false, err
	}

	return res.RowsAffected() > 0, nil
}