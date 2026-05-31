-- Add deployment_id to benchmarks so benchmark executions can be tied to deployed containers
ALTER TABLE benchmarks
  ADD COLUMN IF NOT EXISTS deployment_id UUID;

CREATE INDEX IF NOT EXISTS idx_benchmarks_deployment_id ON benchmarks(deployment_id);
