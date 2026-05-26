# Benchmark Engine

The benchmark engine simulates concurrent traffic against the mock exchange service.

---

# Features

- concurrent goroutine workers
- high-throughput request generation
- request latency tracking
- TPS calculation
- telemetry event publishing

---

# Bot Behaviors

## Retail Trader

Simulates small random orders.

## HFT Bot

Simulates rapid high-frequency traffic.

## Whale Bot

Simulates large-volume orders.

## Panic Seller

Simulates burst sell activity.

---

# Metrics Tracked

- total requests
- successful requests
- failed requests
- latency
- TPS

---

# Concurrency Model

The benchmark engine uses:

- goroutines
- worker pools
- channels
- context cancellation

for scalable concurrent execution.