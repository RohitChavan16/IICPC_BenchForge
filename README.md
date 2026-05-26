# IICPC BenchForge

Distributed benchmarking and telemetry infrastructure platform built for high-concurrency performance testing, real-time observability, and scalable systems experimentation.

---

# Overview

IICPC BenchForge is a production-oriented distributed benchmarking platform designed to simulate concurrent traffic, measure system performance, and process real-time telemetry using event-driven architecture.

The platform is built using Go microservices, Redis Streams, PostgreSQL, Docker, and WebSockets.

---

# Core Features

- Concurrent benchmark workers
- Distributed load generation
- Redis Streams telemetry pipeline
- Real-time telemetry aggregation
- PostgreSQL metrics persistence
- WebSocket live streaming
- Structured JSON logging
- Graceful shutdown handling
- Dockerized microservices architecture

---

# Architecture

```text
Bot Workers
    ↓
Mock Exchange
    ↓
Redis Streams
    ↓
Telemetry Service
    ├── Aggregator
    ├── PostgreSQL
    └── WebSocket Broadcast
```

---

# Tech Stack

## Backend
- Go
- Gin
- Redis Streams
- PostgreSQL
- WebSockets

## Infrastructure
- Docker
- Docker Compose

## Observability
- Structured JSON Logging
- Real-time telemetry aggregation

---

# Services

| Service | Description |
|---|---|
| api-gateway | Entry point for APIs |
| bot-worker | Concurrent benchmarking engine |
| telemetry-service | Metrics aggregation and streaming |
| mock-exchange | Simulated trading exchange |
| redis | Event streaming infrastructure |
| postgres | Persistent telemetry storage |

---

# Getting Started

## Clone Repository

```bash
git clone <repo-url>
cd IICPC_BenchForge
```


# Environment Configuration

Each service maintains its own environment configuration.

Example:

```text
services/api-gateway/.env
services/telemetry-service/.env
services/bot-worker/.env
```

Use `.env.example` files as reference templates.


## Start Infrastructure

```bash
docker compose up --build
```

---

# Current Capabilities

- High-concurrency request simulation
- TPS measurement
- Real-time telemetry ingestion
- Event-driven architecture
- Distributed service orchestration

---

# Roadmap

- Request tracing
- Prometheus metrics
- Grafana dashboards
- Benchmark orchestration API
- Kubernetes deployment
- Distributed worker scaling
- Advanced observability

---

# License

MIT