-- Optimize indexes based on query patterns

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_id_created_at ON submissions(user_id, created_at DESC);
