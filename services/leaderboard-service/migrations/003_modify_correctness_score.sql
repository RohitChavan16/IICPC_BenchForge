-- Drop NOT NULL and DEFAULT from correctness_score
ALTER TABLE leaderboard_entries ALTER COLUMN correctness_score DROP NOT NULL;
ALTER TABLE leaderboard_entries ALTER COLUMN correctness_score DROP DEFAULT;
