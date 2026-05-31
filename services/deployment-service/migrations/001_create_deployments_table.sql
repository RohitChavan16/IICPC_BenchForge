-- Create deployments table
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL,
  container_id TEXT,
  container_image TEXT,
  host_port INTEGER,
  container_port INTEGER DEFAULT 8080,
  deployment_status TEXT NOT NULL DEFAULT 'PENDING',
  deployed_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT deployments_status_check CHECK (deployment_status IN ('PENDING','DEPLOYING','RUNNING','STOPPED','FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_deployments_submission_id ON deployments(submission_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(deployment_status);
