# BenchForge Benchmark Methodology

BenchForge is designed to simulate highly concurrent, production-grade workloads against target algorithmic trading engines. This document outlines the architectural decisions and mathematical models used to evaluate backend correctness and latency under stress.

## 1. Latency Measurement & Histogram Design

To support millions of requests per benchmark session without unbounded memory growth or Garbage Collection (GC) thrashing, BenchForge uses a fixed-bucket `LatencyHistogram`.

### The Problem with Arrays
Traditionally, percentile calculation (`P50`, `P90`, `P99`) involves storing all recorded latencies in a slice (`[]float64`) and sorting them. For 100,000 requests, this requires allocating memory for 100,000 floats. For 10,000,000 requests, this causes significant memory pressure and GC pauses that actively interfere with the benchmark's throughput measurements.

### Fixed-Bucket Histogram
BenchForge implements an `O(1)` memory histogram:
- **Buckets**: 10,001 integer buckets, representing latencies from `0ms` to `10,000ms`.
- **Resolution**: `1ms`. Any sub-millisecond precision is rounded to the nearest integer bucket.
- **Capping**: Latencies exceeding 10 seconds are clamped to the 10,000th bucket.
- **Percentile Calculation**: Calculated dynamically by traversing the bucket counts until the cumulative sum reaches the target percentile fraction.

Because the maximum grading penalty is `5000ms`, this 10-second bound provides perfect accuracy for evaluating P99 thresholds, with a worst-case resolution error of `< 0.5ms` across all distributions.

## 2. Latency Penalty Policy

A key philosophy of BenchForge is that **failed requests are infinitely slow requests**.

If an algorithmic engine sheds load by dropping connections or returning HTTP 500s, discarding those failed requests from the latency pool creates **survivorship bias** (i.e., the engine looks deceptively fast because it only serviced the easy requests).

- **Success (`HTTP 200`)**: Logged at literal execution latency.
- **Failure (`HTTP 4xx / 5xx / Timeout`)**: Logged as a flat **5000ms penalty**.

This ensures that engines that drop traffic will immediately see their P90 and P99 metrics spike, severely degrading their final score.

## 3. Deterministic Persona Generation

To ensure a level playing field, benchmark runs must be perfectly reproducible. If Team A gets 100 "Whale" orders and Team B gets 0, the benchmark is mathematically invalid.

BenchForge uses a seeded deterministic persona generator.
- **Seed**: A shared seed is used to generate the exact sequence of personas.
- **Distribution Mix**:
  - 60% Retail Traders (small, random sizes)
  - 20% Market Makers (tight spreads, medium sizes)
  - 10% Scalpers (crossing spreads)
  - 5% Whales (massive sweeps)
  - 5% HFT Stressors (extreme velocity, 1-qty trades)
- **Execution**: The worker pool uses `atomic.AddInt64` over a globally pre-shuffled array of persona profiles to guarantee the exact same request load profile across different runs.

## 4. Transport Configuration & HTTP Pool

High concurrency testing requires careful management of the OS networking stack. Spawning ephemeral HTTP clients for every request leads to `TIME_WAIT` exhaustion and file descriptor limits.

BenchForge uses a shared, perfectly bounded `http.Transport`:
- **Pool Size**: `MaxIdleConns` and `MaxConnsPerHost` are strictly bounded to `WorkerCount * 2`.
- **Tracer Scenarios**: Both the standard background load generator and the precise Tracer scenarios share this identical connection pool.
- **Benefit**: This guarantees TCP connection reuse (Keep-Alive), ensuring that BenchForge measures the performance of the *target engine*, rather than measuring the cost of TCP handshakes on the benchmarking machine.

## 5. Scoring Model

The final score represents a single holistic metric balancing throughput and stability.

```text
Final Score = (Effective TPS * 10) - (P99 Latency * 0.5)
```

1. **Effective TPS**: `Total Successful Requests / Total Duration in Seconds`.
   - High throughput heavily rewards the engine.
   - Dropped requests drag down Effective TPS.
2. **P99 Latency Penalty**: Subtracts half of the P99 latency (in milliseconds) from the total score.
   - If an engine achieves high TPS but suffers from GC pauses or locks causing a 2000ms P99, it will lose 1000 points.
   - Combined with the 5000ms failure penalty, an engine that drops 2% of its traffic will have a P99 of 5000ms, resulting in a devastating 2500-point penalty.
