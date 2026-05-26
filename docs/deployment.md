# Deployment Guide

## Local Development

### Start Infrastructure

```bash
docker compose up --build
```

---

# Services

| Service | Port |
|---|---|
| api-gateway | 8080 |
| mock-exchange | 9000 |
| telemetry-service | 8081 |
| prometheus | 9090 |
| grafana | 3000 |
| postgres | 5432 |
| redis | 6379 |

---

# Monitoring

## Prometheus

```text
http://localhost:9090
```

## Grafana

```text
http://localhost:3000
```

---

# Environment Configuration

Each service maintains independent `.env` configuration.

Example:

```text
services/mock-exchange/.env
```