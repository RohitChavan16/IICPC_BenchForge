# Telemetry Pipeline

The telemetry system follows an event-driven architecture using Redis Streams.

---

# Flow

```text
Bot Worker
    ↓
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

## Redis Streams

Acts as distributed event bus for telemetry ingestion.

## Consumer Groups

Telemetry consumers process events asynchronously.

## Aggregator

Computes:
- TPS
- latency
- rolling metrics
- success rates

## PostgreSQL

Stores persistent benchmark telemetry.

## WebSockets

Streams real-time telemetry updates to clients.