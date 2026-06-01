-- Add user_id and team_id fields to deployments
ALTER TABLE deployments
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS team_id TEXT;
