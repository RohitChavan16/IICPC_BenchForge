-- Add user_id and team_id fields to submissions
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS team_id TEXT;
