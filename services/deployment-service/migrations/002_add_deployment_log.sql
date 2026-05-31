-- Add deployment_log to deployments
ALTER TABLE deployments
  ADD COLUMN IF NOT EXISTS deployment_log TEXT;
