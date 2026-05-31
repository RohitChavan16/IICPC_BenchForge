-- Add container build fields to submissions
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS container_image TEXT,
  ADD COLUMN IF NOT EXISTS build_log TEXT,
  ADD COLUMN IF NOT EXISTS last_build_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_submissions_container_image ON submissions(container_image);
