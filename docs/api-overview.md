# API Overview

BenchForge provides a suite of internal APIs for inter-service communication and external APIs for frontend dashboards.

## Major Services

| Service | Protocol | Base Port | Primary Responsibility |
|---|---|---|---|
| API Gateway | HTTP/REST | 8080 | Unified ingress, routing, and rate limiting. |
| Benchmark Service | HTTP/REST | 8082 | Orchestration of benchmark lifecycles. |
| Telemetry Service | WebSockets | 8081 | Real-time metric streaming. |
| Leaderboard Service | HTTP + WS | 8084 | Real-time scoring and rank tracking. |
| Mock Exchange | HTTP/REST | 9000 | Baseline target for load testing. |

## Primary Endpoints

### Benchmark Orchestration (REST)
- `POST /api/v1/benchmarks/start`: Initiates a new benchmark run. Requires admin authentication.
- `POST /api/v1/benchmarks/stop`: Broadcasts a graceful shutdown signal to all active Bot Workers.
- `GET /api/v1/benchmarks/{id}/report`: Retrieves the final aggregated metrics and scoring for a completed run.

### Submissions
- `POST /api/v1/submissions/upload`: Accepts a `.zip` or `.tar.gz` payload containing a contestant's source code.
- `GET /api/v1/submissions/{id}/status`: Polls the containerization and build status of an uploaded engine.

## Authentication Flow

BenchForge uses stateless JWT (JSON Web Tokens) for authenticating Admin actions.
1. Admin authenticates via `POST /api/v1/auth/login`.
2. Gateway issues an access token valid for 1 hour.
3. All subsequent requests to protected routes (`/benchmarks/start`, etc.) require the `Authorization: Bearer <token>` header.
4. The API Gateway validates the token signature before proxying the request to the underlying microservices.

## WebSocket Events

The Telemetry and Leaderboard services emit structured JSON events over WebSockets. Clients subscribe to specific rooms or topics.

### Example: Live Telemetry Event
```json
{
  "event_type": "TELEMETRY_TICK",
  "timestamp": 1715600000,
  "payload": {
    "current_tps": 4502,
    "p99_latency_ms": 12.4,
    "active_workers": 5000
  }
}
```

### Example: Leaderboard Rank Change
```json
{
  "event_type": "RANK_UPDATE",
  "payload": {
    "team_id": "team-omega",
    "new_rank": 1,
    "score": 98500
  }
}
```

## Data Contracts

All microservices adhere strictly to versioned Data Contracts, defined via shared Go structs (or Protobufs in future iterations). This ensures that a schema change in the Bot Worker does not break the Telemetry Service's ingestion logic.
