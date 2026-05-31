-- Create leaderboard entries table
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
  final_score NUMERIC NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank ON leaderboard_entries(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_team_name ON leaderboard_entries(team_name);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_final_score ON leaderboard_entries(final_score DESC);
