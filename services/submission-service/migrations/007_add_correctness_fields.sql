-- Add correctness validation fields
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS correctness_score NUMERIC,
ADD COLUMN IF NOT EXISTS correctness_details JSONB;
