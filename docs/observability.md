# Request Tracing

The platform implements request-level tracing using middleware-based correlation IDs.

## Features

- X-Request-ID propagation
- Structured HTTP request logging
- Request latency measurement
- Distributed request correlation

## Example Log

```json
{
  "request_id":"req_abc123",
  "method":"POST",
  "path":"/order",
  "status":200,
  "latency_ms":5
}
```









# Prometheus Metrics

The mock-exchange service exposes Prometheus metrics for production-grade observability.

## Metrics

- http_requests_total
- http_request_duration_seconds
- active_requests

## Endpoint

```text
/metrics
```

## Features

- request counting
- latency histograms
- active request tracking
- Prometheus-compatible scraping




# Observability System

IICPC BenchForge implements production-grade observability for distributed benchmarking workloads.

---

# Features

## Structured Logging

Services use structured JSON logging with configurable log levels.

### Log Levels

- debug
- info
- warn
- error

Configured using:

```env
LOG_LEVEL=info
```

---

# Request Tracing

The platform implements request-level tracing using correlation IDs.

### Features

- X-Request-ID propagation
- request latency tracking
- request correlation
- middleware-based instrumentation

---

# Prometheus Metrics

The mock-exchange service exposes Prometheus-compatible metrics.

## Endpoint

```text
/metrics
```

## Metrics

### Request Counter

```text
http_requests_total_total
```

Tracks total HTTP requests.

---

### Latency Histogram

```text
http_request_duration_seconds
```

Tracks request latency distribution.

---

### Active Requests

```text
active_requests
```

Tracks concurrent in-flight requests.

---

# Grafana Dashboards

Grafana provides real-time observability dashboards.

## Panels

- Transactions Per Second (TPS)
- Average Request Latency
- Active Concurrent Requests
- Total Processed Requests

---

# Benefits

- real-time monitoring
- distributed observability
- latency analysis
- performance debugging
- benchmark analytics