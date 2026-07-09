-- Optimize indexes based on query patterns

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_benchmarks_user_id_created_at ON benchmarks(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_benchmarks_status_created_at ON benchmarks(status, created_at ASC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_benchmarks_lower_team_name ON benchmarks(LOWER(team_name), status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_benchmarks_submission_id ON benchmarks(submission_id);
