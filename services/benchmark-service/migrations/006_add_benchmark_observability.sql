-- Add observability fields to benchmarks

ALTER TABLE benchmarks
ADD COLUMN last_heartbeat TIMESTAMP,
ADD COLUMN failure_reason TEXT,
ADD COLUMN wait_time_seconds INT,
ADD COLUMN execution_time_seconds INT;
