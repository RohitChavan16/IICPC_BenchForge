-- Optimize indexes based on query patterns

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_entries_rank_score ON leaderboard_entries(rank ASC NULLS LAST, final_score DESC);
