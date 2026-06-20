
-- Deduplicate existing records by keeping the one with the lowest id
DELETE FROM telemetry_metrics
WHERE id NOT IN (
    SELECT MIN(id)
    FROM telemetry_metrics
    GROUP BY request_id
);

-- Add unique constraint
ALTER TABLE telemetry_metrics ADD CONSTRAINT unique_request_id UNIQUE (request_id);

