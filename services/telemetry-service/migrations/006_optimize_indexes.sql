-- Optimize indexes based on query patterns

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_benchmark_replays_status_created_at ON benchmark_replays(status, created_at ASC);
