package database

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Metric struct {
	RequestID string
	BotType   string
	Latency   int64
	Success   bool
}

func InsertMetric(
	db *pgxpool.Pool,
	metric Metric,
) error {

	query := `
	INSERT INTO telemetry_metrics
	(request_id, bot_type, latency, success, created_at)
	VALUES ($1, $2, $3, $4, $5)
	`

	_, err := db.Exec(
		context.Background(),
		query,
		metric.RequestID,
		metric.BotType,
		metric.Latency,
		metric.Success,
		time.Now(),
	)

	return err
}