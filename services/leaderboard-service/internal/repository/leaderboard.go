package repository

import (
	"database/sql"
	"math"

	"github.com/RohitChavan16/IICPC_BenchForge/services/leaderboard-service/internal/model"
)

func EnsureLeaderboardTable(db *sql.DB) error {
	query := `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_id UUID UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  submission_id UUID,
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
  concurrency_score NUMERIC NOT NULL DEFAULT 0,
  final_score NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE leaderboard_entries ADD COLUMN IF NOT EXISTS correctness_score NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE leaderboard_entries ADD COLUMN IF NOT EXISTS concurrency_score NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE leaderboard_entries ADD COLUMN IF NOT EXISTS submission_id UUID;

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank ON leaderboard_entries(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_team_name ON leaderboard_entries(team_name);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_final_score ON leaderboard_entries(final_score DESC);
`
	_, err := db.Exec(query)
	return err
}

func ListLeaderboardEntries(db *sql.DB, limit, offset int) ([]model.LeaderboardEntry, int, error) {
	countRow := db.QueryRow(`SELECT COUNT(*) FROM leaderboard_entries`)
	var total int
	if err := countRow.Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := db.Query(`SELECT id, benchmark_id, team_name, submission_id, submission_name, deployment_id, tps, success_rate, p50, p90, p99, total_requests, duration_seconds, correctness_score, concurrency_score, final_score, rank, created_at, updated_at FROM leaderboard_entries ORDER BY rank ASC NULLS LAST, final_score DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := []model.LeaderboardEntry{}
	for rows.Next() {
		var entry model.LeaderboardEntry
		var subID sql.NullString
		if err := rows.Scan(&entry.ID, &entry.BenchmarkID, &entry.TeamName, &subID, &entry.SubmissionName, &entry.DeploymentID, &entry.TPS, &entry.SuccessRate, &entry.P50, &entry.P90, &entry.P99, &entry.TotalRequests, &entry.Duration, &entry.CorrectnessScore, &entry.ConcurrencyScore, &entry.FinalScore, &entry.Rank, &entry.CreatedAt, &entry.UpdatedAt); err != nil {
			return nil, 0, err
		}
		if subID.Valid {
			entry.SubmissionID = subID.String
		}
		items = append(items, entry)
	}
	return items, total, rows.Err()
}

func ListTopLeaderboardEntries(db *sql.DB, limit int) ([]model.LeaderboardEntry, error) {
	rows, err := db.Query(`SELECT id, benchmark_id, team_name, submission_id, submission_name, deployment_id, tps, success_rate, p50, p90, p99, total_requests, duration_seconds, correctness_score, concurrency_score, final_score, rank, created_at, updated_at FROM leaderboard_entries ORDER BY rank ASC NULLS LAST, final_score DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []model.LeaderboardEntry{}
	for rows.Next() {
		var entry model.LeaderboardEntry
		var subID sql.NullString
		if err := rows.Scan(&entry.ID, &entry.BenchmarkID, &entry.TeamName, &subID, &entry.SubmissionName, &entry.DeploymentID, &entry.TPS, &entry.SuccessRate, &entry.P50, &entry.P90, &entry.P99, &entry.TotalRequests, &entry.Duration, &entry.CorrectnessScore, &entry.ConcurrencyScore, &entry.FinalScore, &entry.Rank, &entry.CreatedAt, &entry.UpdatedAt); err != nil {
			return nil, err
		}
		if subID.Valid {
			entry.SubmissionID = subID.String
		}
		items = append(items, entry)
	}
	return items, rows.Err()
}

func ListLeaderboardEntriesByTeam(db *sql.DB, team string) ([]model.LeaderboardEntry, error) {
	rows, err := db.Query(`SELECT id, benchmark_id, team_name, submission_id, submission_name, deployment_id, tps, success_rate, p50, p90, p99, total_requests, duration_seconds, correctness_score, concurrency_score, final_score, rank, created_at, updated_at FROM leaderboard_entries WHERE LOWER(team_name) = LOWER($1) ORDER BY rank ASC NULLS LAST, final_score DESC`, team)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []model.LeaderboardEntry{}
	for rows.Next() {
		var entry model.LeaderboardEntry
		var subID sql.NullString
		if err := rows.Scan(&entry.ID, &entry.BenchmarkID, &entry.TeamName, &subID, &entry.SubmissionName, &entry.DeploymentID, &entry.TPS, &entry.SuccessRate, &entry.P50, &entry.P90, &entry.P99, &entry.TotalRequests, &entry.Duration, &entry.CorrectnessScore, &entry.ConcurrencyScore, &entry.FinalScore, &entry.Rank, &entry.CreatedAt, &entry.UpdatedAt); err != nil {
			return nil, err
		}
		if subID.Valid {
			entry.SubmissionID = subID.String
		}
		items = append(items, entry)
	}
	return items, rows.Err()
}

func UpsertLeaderboardEntry(db *sql.DB, benchmarkID, teamName, submissionID, submissionName, deploymentID string, tps, successRate, p50, p90, p99 float64, totalRequests int64, duration int, correctnessScore float64, concurrencyScore float64, finalScore float64) error {
	query := `
INSERT INTO leaderboard_entries (benchmark_id, team_name, submission_id, submission_name, deployment_id, tps, success_rate, p50, p90, p99, total_requests, duration_seconds, correctness_score, concurrency_score, final_score, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, now(), now())
ON CONFLICT (benchmark_id) DO UPDATE SET
  team_name = EXCLUDED.team_name,
  submission_id = EXCLUDED.submission_id,
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
  concurrency_score = EXCLUDED.concurrency_score,
  final_score = EXCLUDED.final_score,
  updated_at = now()
`
	var dbSubID interface{} = nil
	if submissionID != "" {
		dbSubID = submissionID
	}
	if _, err := db.Exec(query, benchmarkID, teamName, dbSubID, submissionName, deploymentID, tps, successRate, p50, p90, p99, totalRequests, duration, correctnessScore, concurrencyScore, finalScore); err != nil {
		return err
	}
	return updateLeaderboardRanks(db)
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

func BackfillLeaderboardEntries(db *sql.DB) error {
	query := `
INSERT INTO leaderboard_entries (benchmark_id, team_name, submission_id, submission_name, deployment_id, tps, success_rate, p50, p90, p99, total_requests, duration_seconds, correctness_score, concurrency_score, final_score, created_at, updated_at)
SELECT
  b.id,
  s.team_name,
  s.id as submission_id,
  s.submission_name,
  b.deployment_id,
  CASE WHEN b.duration_seconds > 0 THEN b.total_requests::numeric / b.duration_seconds ELSE 0 END AS tps,
  CASE WHEN b.total_requests > 0 THEN (b.success_count::numeric / b.total_requests) * 100 ELSE 0 END AS success_rate,
  COALESCE(b.p50, 0),
  COALESCE(b.p90, 0),
  COALESCE(b.p99, 0),
  b.total_requests,
  COALESCE(b.duration_seconds, 0),
  COALESCE(s.correctness_score, CASE WHEN b.total_requests > 0 THEN (b.success_count::numeric / b.total_requests) * 100 ELSE 0 END) AS correctness_score,
  100 AS concurrency_score,
  0 AS final_score, -- will be updated by a separate backfill pass if needed, or we just leave as 0 and it updates on next run
  now(),
  now()
FROM benchmarks b
JOIN deployments d ON b.deployment_id = d.id
JOIN submissions s ON d.submission_id = s.id
LEFT JOIN leaderboard_entries l ON l.benchmark_id = b.id
WHERE b.status = 'COMPLETED' AND l.id IS NULL
`
	if _, err := db.Exec(query); err != nil {
		return err
	}
	return updateLeaderboardRanks(db)
}

func ComputeFinalScore(tps, successRate, p99, correctnessScore, concurrencyScore float64) float64 {
	if correctnessScore < 0 {
		correctnessScore = 0
	}
	if concurrencyScore < 0 {
		concurrencyScore = 0
	}
	
	effectiveTps := tps * (successRate / 100.0)
	latencyFactor := 250.0 / (250.0 + p99)
	correctnessMultiplier := math.Pow(correctnessScore/100.0, 2)
	
	// TEMPORARILY IGNORE CONCURRENCY until tracer metrics are verified end-to-end
	concurrencyMultiplier := 1.0 // math.Pow(concurrencyScore/100.0, 2)
	
	finalScore := effectiveTps * latencyFactor * correctnessMultiplier * concurrencyMultiplier
	return math.Round(finalScore*100) / 100
}

func SafeDuration(duration *int) int {
	if duration == nil {
		return 0
	}
	return *duration
}

func BuildLeaderboardEntryFromBenchmark(db *sql.DB, benchmarkID string) (*model.LeaderboardEntry, error) {
	query := `
SELECT
  b.total_requests,
  b.success_count,
  b.p50,
  b.p90,
  b.p99,
  b.duration_seconds,
  b.deployment_id,
  b.tracer_total,
  b.tracer_success,
  s.team_name,
  s.id as submission_id,
  s.submission_name,
  s.correctness_score
FROM benchmarks b
JOIN deployments d ON b.deployment_id = d.id
JOIN submissions s ON d.submission_id = s.id
WHERE b.id = $1
`
	var totalRequests int64
	var successCount int64
	var p50 sql.NullFloat64
	var p90 sql.NullFloat64
	var p99 sql.NullFloat64
	var duration sql.NullInt64
	var deploymentID string
	var tracerTotal sql.NullInt64
	var tracerSuccess sql.NullInt64
	var teamName string
	var submissionID sql.NullString
	var submissionName string
	var correctnessScore sql.NullFloat64

	if err := db.QueryRow(query, benchmarkID).Scan(&totalRequests, &successCount, &p50, &p90, &p99, &duration, &deploymentID, &tracerTotal, &tracerSuccess, &teamName, &submissionID, &submissionName, &correctnessScore); err != nil {
		return nil, err
	}

	d := int(duration.Int64)
	if !duration.Valid {
		d = 0
	}
	computedTps := 0.0
	if d > 0 {
		computedTps = float64(totalRequests) / float64(d)
	}
	successRate := 0.0
	if totalRequests > 0 {
		successRate = (float64(successCount) / float64(totalRequests)) * 100
	}
	
	// Phase 2: UNKNOWN (NULL) correctness score is treated as 0 for enforcement
	actualCorrectness := 0.0
	if correctnessScore.Valid {
		actualCorrectness = correctnessScore.Float64
	}

	// Concurrency Score logic
	concurrencyScore := 100.0 // Default to 100 if no tracers ran
	if tracerTotal.Valid && tracerTotal.Int64 > 0 {
		concurrencyScore = (float64(tracerSuccess.Int64) / float64(tracerTotal.Int64)) * 100.0
	}

	finalScore := ComputeFinalScore(computedTps, successRate, p99.Float64, actualCorrectness, concurrencyScore)

	return &model.LeaderboardEntry{
		BenchmarkID:      benchmarkID,
		TeamName:         teamName,
		SubmissionID:     submissionID.String,
		SubmissionName:   submissionName,
		DeploymentID:     deploymentID,
		TPS:              computedTps,
		SuccessRate:      successRate,
		P50:              p50.Float64,
		P90:              p90.Float64,
		P99:              p99.Float64,
		TotalRequests:    totalRequests,
		Duration:         d,
		CorrectnessScore: actualCorrectness,
		ConcurrencyScore: concurrencyScore,
		FinalScore:       math.Round(finalScore*100) / 100,
	}, nil
}

func UpsertLeaderboardEntryFromBenchmark(db *sql.DB, benchmarkID string) error {
	entry, err := BuildLeaderboardEntryFromBenchmark(db, benchmarkID)
	if err != nil {
		return err
	}
	return UpsertLeaderboardEntry(db, benchmarkID, entry.TeamName, entry.SubmissionID, entry.SubmissionName, entry.DeploymentID, entry.TPS, entry.SuccessRate, entry.P50, entry.P90, entry.P99, entry.TotalRequests, entry.Duration, entry.CorrectnessScore, entry.ConcurrencyScore, entry.FinalScore)
}
