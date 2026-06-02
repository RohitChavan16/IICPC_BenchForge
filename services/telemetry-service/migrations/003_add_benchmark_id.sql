-- Add benchmark_id to telemetry metrics so we can aggregate historical telemetry per benchmark
ALTER TABLE public.telemetry_metrics
ADD COLUMN IF NOT EXISTS benchmark_id TEXT;

-- Add an index to speed up per-benchmark queries
CREATE INDEX IF NOT EXISTS idx_telemetry_metrics_benchmark_id_created_at ON public.telemetry_metrics (benchmark_id, created_at);
