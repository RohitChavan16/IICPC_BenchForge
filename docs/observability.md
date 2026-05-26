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