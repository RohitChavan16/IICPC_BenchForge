# Future Roadmap

BenchForge is currently an incredibly robust load generation and telemetry pipeline, but our vision extends further. We aim to become the definitive standard for distributed benchmarking in competitive engineering environments.

## Current Capabilities
- Massive concurrent load generation via Goroutine pools.
- Microsecond-precision telemetry ingestion using Redis Streams.
- Real-time scoring and Live WebSocket Leaderboards.
- Deterministic Replay Engine for post-mortem analysis.

## Near-Term Enhancements

- **Multi-Contest Support**
  - Moving beyond single-tenant execution to allow multiple discrete competitions or hacking tracks to run simultaneously.
  - Granular API keys and tenant isolation in PostgreSQL.
- **Distributed Benchmark Workers**
  - Refactoring the `bot-worker` orchestrator to natively support Kubernetes.
  - Automatically spinning up transient worker pods across multiple physical nodes to bypass single-machine network interface card (NIC) bottlenecks.

## Long-Term Vision

- **Historical Analytics**
  - Storing years of benchmark data in a petabyte-scale data warehouse (e.g., ClickHouse or BigQuery).
  - Allowing teams to compare their current engine's performance against previous hackathon winners.
- **Advanced Replay Analytics**
  - Providing deep memory profiling and CPU flame graphs overlaid on the Replay Engine timeline.
- **ML-Based Insights**
  - Utilizing Machine Learning models trained on historical telemetry to automatically detect the root cause of bottlenecks (e.g., "The model indicates a 95% probability of a mutex deadlock in your matching engine's sweep logic").
