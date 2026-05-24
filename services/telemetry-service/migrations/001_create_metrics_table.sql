CREATE TABLE IF NOT EXISTS telemetry_metrics (

    id BIGSERIAL PRIMARY KEY,

    request_id TEXT NOT NULL,

    bot_type TEXT NOT NULL,

    latency BIGINT NOT NULL,

    success BOOLEAN NOT NULL,

    created_at TIMESTAMP NOT NULL
);