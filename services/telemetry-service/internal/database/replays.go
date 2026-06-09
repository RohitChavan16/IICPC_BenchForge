package database

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type BenchmarkReplay struct {
	BenchmarkID string
	Status      string
	ReplayData  []byte // JSONB
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func InsertReplayStatus(db *pgxpool.Pool, benchmarkID string, status string) error {
	query := `
	INSERT INTO public.benchmark_replays (benchmark_id, status)
	VALUES ($1, $2)
	ON CONFLICT (benchmark_id) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
	`
	_, err := db.Exec(context.Background(), query, benchmarkID, status)
	return err
}

func UpdateReplayData(db *pgxpool.Pool, benchmarkID string, status string, data []byte) error {
	query := `
	UPDATE public.benchmark_replays
	SET status = $2, replay_data = $3, updated_at = CURRENT_TIMESTAMP
	WHERE benchmark_id = $1
	`
	_, err := db.Exec(context.Background(), query, benchmarkID, status, data)
	return err
}

func GetReplay(db *pgxpool.Pool, benchmarkID string) (*BenchmarkReplay, error) {
	query := `
	SELECT benchmark_id, status, replay_data, created_at, updated_at
	FROM public.benchmark_replays
	WHERE benchmark_id = $1
	`
	row := db.QueryRow(context.Background(), query, benchmarkID)

	var replay BenchmarkReplay
	var data []byte
	err := row.Scan(&replay.BenchmarkID, &replay.Status, &data, &replay.CreatedAt, &replay.UpdatedAt)
	if err != nil {
		return nil, err
	}
	replay.ReplayData = data
	return &replay, nil
}
