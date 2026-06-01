package repository

import (
	"database/sql"
	"math"
)

func EnsureLeaderboardTable(db *sql.DB) error {
	query := `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_id UUID UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  submission_name TEXT NOT NULL,
  deployment_id UUID NOT NULL,
  tps NUMERIC NOT NULL DEFAULT 0,
  success_rate NUMERIC NOT NULL DEFAULT 0,
  p50 NUMERIC,
  p90 NUMERIC,
  p99 NUMERIC,
  total_requests BIGINT NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  correctness_score NUMERIC NOT NULL DEFAULT 0,
  final_score NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank ON leaderboard_entries(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_team_name ON leaderboard_entries(team_name);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_final_score ON leaderboard_entries(final_score DESC);
`
	_, err := db.Exec(query)
	return err
}

func UpsertLeaderboardEntryFromBenchmark(db *sql.DB, benchmarkID string) error {
	query := `
SELECT
  b.total_requests,
  b.success_count,
  b.p50,
  b.p90,
  b.p99,
  b.duration_seconds,
  b.deployment_id,
  s.team_name,
  s.submission_name
FROM benchmarks b
JOIN deployments d ON b.deployment_id = d.id
JOIN submissions s ON d.submission_id = s.id
WHERE b.id = $1
`
	var totalRequests, successCount sql.NullInt64
	var p50, p90, p99 sql.NullFloat64
	var duration sql.NullInt64
	var deploymentID, teamName, submissionName string

	if err := db.QueryRow(query, benchmarkID).Scan(&totalRequests, &successCount, &p50, &p90, &p99, &duration, &deploymentID, &teamName, &submissionName); err != nil {
		return err
	}

	total := int64(0)
	if totalRequests.Valid {
		total = totalRequests.Int64
	}
	success := int64(0)
	if successCount.Valid {
		success = successCount.Int64
	}
	dur := 0
	if duration.Valid {
		dur = int(duration.Int64)
	}

	computedTps := 0.0
	if dur > 0 {
		computedTps = float64(total) / float64(dur)
	}
	computedSuccessRate := 0.0
	if total > 0 {
		computedSuccessRate = (float64(success) / float64(total)) * 100
	}
	finalScore := computeFinalScore(computedTps, computedSuccessRate, p99.Float64)

	query = `
INSERT INTO leaderboard_entries (benchmark_id, team_name, submission_name, deployment_id, tps, success_rate, p50, p90, p99, total_requests, duration_seconds, correctness_score, final_score, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), now())
ON CONFLICT (benchmark_id) DO UPDATE SET
  team_name = EXCLUDED.team_name,
  submission_name = EXCLUDED.submission_name,
  deployment_id = EXCLUDED.deployment_id,
  tps = EXCLUDED.tps,
  success_rate = EXCLUDED.success_rate,
  p50 = EXCLUDED.p50,
  p90 = EXCLUDED.p90,
  p99 = EXCLUDED.p99,
  total_requests = EXCLUDED.total_requests,
  duration_seconds = EXCLUDED.duration_seconds,
  correctness_score = EXCLUDED.correctness_score,
  final_score = EXCLUDED.final_score,
  updated_at = now()
`
	if _, err := db.Exec(query, benchmarkID, teamName, submissionName, deploymentID, computedTps, computedSuccessRate, p50.Float64, p90.Float64, p99.Float64, total, dur, computedSuccessRate, finalScore); err != nil {
		return err
	}

	return updateLeaderboardRanks(db)
}

func computeFinalScore(tps, correctnessScore, p99 float64) float64 {
	if correctnessScore < 0 {
		correctnessScore = 0
	}
	correctnessPart := correctnessScore * 0.5

	tpsScore := (tps / 20000.0) * 100.0
	if tpsScore > 100 {
		tpsScore = 100
	}
	tpsPart := tpsScore * 0.3

	p99Score := 100.0 - (p99 / 10.0)
	if p99Score > 100 {
		p99Score = 100
	}
	if p99Score < 0 {
		p99Score = 0
	}
	p99Part := p99Score * 0.2

	return math.Round((correctnessPart + tpsPart + p99Part)*100) / 100
}

func updateLeaderboardRanks(db *sql.DB) error {
	query := `
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY final_score DESC, success_rate DESC, p99 ASC, tps DESC, created_at ASC) AS rank_value
  FROM leaderboard_entries
)
UPDATE leaderboard_entries
SET rank = ranked.rank_value
FROM ranked
WHERE leaderboard_entries.id = ranked.id
`
	_, err := db.Exec(query)
	return err
}
