-- 1. Cleanup orphaned / stale rows
DELETE FROM benchmarks
WHERE target_type = 'deployment' 
  AND (submission_id IS NULL OR deployment_id IS NULL);

DELETE FROM benchmarks
WHERE status IN ('CREATED', 'QUEUED');

-- 2. Add constraints
ALTER TABLE benchmarks 
ADD CONSTRAINT chk_target_deps 
CHECK (target_type = 'mock' OR (submission_id IS NOT NULL AND deployment_id IS NOT NULL));

ALTER TABLE benchmarks 
ADD CONSTRAINT fk_submission 
FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE;

ALTER TABLE benchmarks 
ADD CONSTRAINT fk_deployment 
FOREIGN KEY (deployment_id) REFERENCES deployments(id) ON DELETE CASCADE;
