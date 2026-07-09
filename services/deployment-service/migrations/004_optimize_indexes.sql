-- Optimize indexes based on query patterns

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deployments_user_id_created_at ON deployments(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deployments_host_port ON deployments(host_port, deployment_status);
