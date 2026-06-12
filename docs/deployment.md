# Deployment Guide

BenchForge is designed to run in highly containerized, distributed environments. It relies entirely on Docker for isolation, networking, and dependency management.

## Local Setup

Local development mimics the production environment using `docker-compose`. 

1. Ensure Docker Desktop (or the Docker daemon) is running.
2. Clone the repository and navigate to the root directory.
3. Generate the required `.env` configurations:
   ```bash
   cp .env.example .env
   # Ensure ports 8080-8090, 5432, 6379, 3000, 9090 are available on your host.
   ```
4. Build and start the infrastructure:
   ```bash
   docker compose up --build -d
   ```

## Docker Setup

The repository contains a highly optimized, multi-stage Docker build process for the Go microservices.
- **Stage 1 (Builder)**: Pulls the Go alpine image, downloads modules, and statically compiles the Go binaries.
- **Stage 2 (Runner)**: Uses `scratch` or a minimal Alpine image to host the statically linked binary, resulting in image sizes often under 15MB.

## Service Startup Order

Due to the event-driven nature of the platform, the boot sequence is critical:

1. **State Layers**: `redis` and `postgres` initialize first.
2. **Exporters**: `redis-exporter` and `postgres-exporter` attach to the state layers.
3. **Core Services**: `api-gateway`, `telemetry-service`, and `benchmark-service` wait for database connections to establish.
4. **Edge/Worker Nodes**: `bot-worker` and `mock-exchange` spin up, establishing Redis Pub/Sub connections to listen for orchestration commands.
5. **Observability Stack**: `prometheus` and `grafana` boot, beginning the scrape cycle.

*Note: The `docker-compose.yml` uses `depends_on` to enforce this startup topology.*

## Monitoring Stack

BenchForge provides a production-grade observability pipeline out-of-the-box.

- **Prometheus** (`localhost:9090`): Configured via `deployments/prometheus/prometheus.yml` to scrape metrics from every Go microservice (via `/metrics` endpoints) and from the infrastructure exporters.
- **Grafana** (`localhost:3000`): Connects to Prometheus. Pre-provisioned dashboards are available to track TPS, Latency Percentiles, Goroutine counts, and memory allocations.
- **cAdvisor** (`localhost:8088`): Monitors container resource limits, CPU usage, and network I/O at the Docker daemon level.

## Production Considerations

When deploying BenchForge to a staging or production Kubernetes cluster, consider the following:
1. **Redis Persistence**: While Redis is an event bus, AOF (Append Only File) should be enabled to prevent telemetry loss if the Redis Pod is evicted.
2. **Network Topology**: The `bot-worker` nodes generate massive amounts of TCP traffic. Ensure they are placed on network-optimized instances (e.g., AWS c5n series).
3. **Connection Pooling**: Configure the PostgreSQL `max_connections` appropriately, as the `telemetry-service` uses parallel batch inserts.
4. **Security**: Do not expose the API Gateway without TLS termination (e.g., via NGINX or AWS ALB). Protect the `prometheus` and `grafana` endpoints via VPN or robust authentication.