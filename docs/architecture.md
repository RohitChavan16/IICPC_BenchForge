# System Architecture

## Overview

IICPC BenchForge follows an event-driven distributed systems architecture for concurrent benchmarking and telemetry processing.

---

# High-Level Flow

```text
Bot Worker
    ↓ HTTP Requests
Mock Exchange
    ↓ Metrics Events
Redis Streams
    ↓
Telemetry Consumer
    ↓
Aggregator
    ↓
PostgreSQL
    ↓
WebSocket Broadcast
```

---

# Components

## Bot Worker

Responsible for:
- generating concurrent traffic
- simulating benchmark workloads
- measuring request metrics

### Features
- goroutine worker pools
- concurrent HTTP requests
- TPS calculation
- latency tracking

---

## Mock Exchange

Simulated trading exchange service.

### Endpoints

- `/health`
- `/order`
- `/cancel`

Used for benchmark testing.

---

## Redis Streams

Acts as distributed telemetry event bus.

### Responsibilities
- asynchronous event streaming
- decoupled telemetry ingestion
- consumer group processing

---

## Telemetry Service

Processes telemetry events in real time.

### Responsibilities
- consume metrics
- aggregate telemetry
- persist metrics
- broadcast updates

---

## PostgreSQL

Persistent storage layer for telemetry metrics.

Stores:
- latency
- success/failure
- timestamps
- benchmark metadata

---

# Infrastructure Design

## Dockerized Services

Each service runs independently inside isolated containers.

### Benefits
- scalability
- deployment isolation
- reproducible environments

---

# Observability Features

- structured JSON logging
- graceful shutdown
- real-time telemetry streaming
- event-driven processing








# Graceful Shutdown Architecture

The telemetry service implements production-grade graceful shutdown handling using Go contexts and OS signal propagation.

## Features

- SIGINT/SIGTERM handling
- Context-based goroutine cancellation
- Graceful Redis consumer shutdown
- PostgreSQL pool cleanup
- Controlled shutdown lifecycle

## Flow

OS Signal
    ↓
Signal Handler
    ↓
Context Cancellation
    ↓
Consumer Shutdown
    ↓
DB Cleanup
    ↓
Service Exit










# Structured Logging

The telemetry service implements centralized structured JSON logging using Go slog.

## Features

- JSON formatted logs
- Service-aware metadata
- Structured error logging
- Centralized logger package
- Production-grade observability

## Example

{
  "time":"2026-05-24T13:00:00Z",
  "level":"INFO",
  "service":"telemetry-service",
  "msg":"Starting telemetry service"
}



# Monitoring Architecture

The platform implements a cloud-native observability pipeline using Prometheus and Grafana.

## Flow

```text
Mock Exchange
    ↓
Prometheus Metrics Endpoint (/metrics)
    ↓
Prometheus Scraping
    ↓
Time-Series Metrics Storage
    ↓
Grafana Dashboards
```

## Monitoring Features

- request throughput monitoring
- latency tracking
- active request monitoring
- real-time TPS visualization
- Prometheus instrumentation
- Grafana dashboards

## Technologies

- Prometheus
- Grafana
- PromQL
- Go Prometheus Client