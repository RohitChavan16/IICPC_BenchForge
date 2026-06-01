-- Add correctness_score to leaderboard_entries
ALTER TABLE leaderboard_entries
  ADD COLUMN IF NOT EXISTS correctness_score NUMERIC NOT NULL DEFAULT 0;
