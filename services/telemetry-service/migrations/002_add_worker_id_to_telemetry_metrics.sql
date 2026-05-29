-- Add worker_id to telemetry metrics so we can attribute metrics to workers
ALTER TABLE public.telemetry_metrics
ADD COLUMN IF NOT EXISTS worker_id TEXT;

-- Add an index to speed up per-worker queries
CREATE INDEX IF NOT EXISTS idx_telemetry_metrics_worker_id_created_at ON public.telemetry_metrics (worker_id, created_at);
