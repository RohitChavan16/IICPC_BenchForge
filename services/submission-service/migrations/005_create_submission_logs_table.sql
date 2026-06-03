CREATE TABLE submission_logs (
    id BIGSERIAL PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_submission_logs_submission_id ON submission_logs(submission_id);
