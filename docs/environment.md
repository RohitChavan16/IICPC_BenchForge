# Environment Configuration Guide

BenchForge follows the 12-Factor App methodology. All configuration that varies between deployments (local, staging, production) is injected via environment variables.

## Purpose

The centralized `.env` configuration orchestrates:
- Database connection strings.
- Internal service routing (ports and URLs).
- Performance tuning (concurrency limits, timeouts).
- Observability feature toggles.

Rather than hardcoding connections, services rely on these variables, enabling seamless transitions from Docker Compose to Kubernetes.

## Example Values

A typical local development setup might look like this for the **Bot Worker**:
```bash
REDIS_URL=redis:6379
POSTGRES_URL=postgres://postgres:password@postgres:5432/iicpc
TARGET_EXCHANGE_URL=http://mock-exchange:9000
MAX_CONCURRENCY=5000
LOG_LEVEL=debug
```

## Required vs Optional

### Required Variables
These must be present for a service to boot. If missing, the service will log a `FATAL` error and gracefully exit immediately.
- `REDIS_URL`: The Redis endpoint (Stream event bus).
- `POSTGRES_URL`: The persistent telemetry database.
- `*_PORT` or `TARGET_*_URL`: The HTTP binding port or the target URL for communication.

### Optional Variables
These have sensible defaults programmed into the Go code but can be overridden for performance tuning.
- `MAX_CONCURRENCY` (Default: 1000): Limits the maximum number of active Goroutines in the worker pool.
- `LOG_LEVEL` (Default: info): Sets the `slog` verbosity (`debug`, `info`, `warn`, `error`).
- `CONSUMER_GROUP` (Default: telemetry_group): The Redis Stream consumer group identifier.

## Security Notes

1. **Never Commit Secrets:** The `.env` file must always be included in `.gitignore`. Only commit `.env.example`.
2. **Production Passwords:** Ensure `POSTGRES_URL` does not use default passwords (e.g., `postgres:password`) in production.
3. **Secret Managers:** In production (AWS/GCP/Kubernetes), do not use `.env` files on disk. Inject these variables using a secure provider like AWS Secrets Manager, HashiCorp Vault, or Kubernetes Secrets.
