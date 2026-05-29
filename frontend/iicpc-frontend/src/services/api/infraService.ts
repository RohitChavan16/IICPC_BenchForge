import { instantQuery, series } from '@/services/prometheus/prometheus'
import { METRIC_CATALOG } from '@/services/prometheus/metricMappings'
import type { HealthStatus, InfrastructureMetric, PostgresMetric, RedisMetric, WorkerStatus } from '@/types/api'

async function safeInstant(query: string) {
  try {
    const res = await instantQuery(query)
    return res
  } catch (err) {
    return []
  }
}

export async function fetchHealthStatus(): Promise<HealthStatus[]> {
  // Map services to Prometheus scrape job names where available.
  const services = [
    { label: 'api-gateway', job: 'api-gateway' },
    { label: 'telemetry-service', job: 'telemetry-service' },
    { label: 'mock-exchange', job: 'mock-exchange' },
    { label: 'bot-worker', job: 'bot-worker' },
    { label: 'postgres', job: 'postgres-exporter' },
    { label: 'redis', job: 'redis-exporter' },
  ]

  const results: HealthStatus[] = []

  await Promise.all(services.map(async (svc) => {
    const data = await safeInstant(`up{job=\"${svc.job}\"}`)
    const up = data.length > 0 && data[0].value?.[1] === '1'
    results.push({
      label: svc.label,
      status: up ? 'Healthy' : 'Warning',
      details: up ? 'Exporter reachable' : 'No exporter metrics found',
    })
  }))

  return results
}

export async function fetchInfrastructureMetrics(): Promise<InfrastructureMetric[]> {
  const metrics: InfrastructureMetric[] = []

  // Discover available metric names per job to avoid guessing
  const pgSeries = await series(['{job="postgres-exporter"}'])
  const pgMetricNames = new Set(pgSeries.map((s) => (s.__name__ ?? '') as string))

  const redisSeries = await series(['{job="redis-exporter"}'])
  const redisMetricNames = new Set(redisSeries.map((s) => (s.__name__ ?? '') as string))

  const cadvisorSeries = await series(['{job="cadvisor"}'])
  const cadvisorMetricNames = new Set(cadvisorSeries.map((s) => (s.__name__ ?? '') as string))

  // Helper that checks discovery before running the promql (unless forced)
  async function runIfDiscovered(mapping: { label: string; promql: string; unit?: string; key?: string; force?: boolean }, discovered: Set<string> | null) {
    try {
      const metricNameMatch = mapping.promql.match(/[a-zA-Z_:][a-zA-Z0-9_:]*/)
      const metricName = metricNameMatch ? metricNameMatch[0] : null
      if (!mapping.force && discovered && metricName && !discovered.has(metricName)) {
        return
      }

      const r = await safeInstant(mapping.promql)
      if (r.length > 0) {
        metrics.push({ label: mapping.label, value: r[0].value[1], change: '-', trend: 'flat', detail: mapping.unit ?? '' })
      }
    } catch (e) {
      // ignore individual metric failures
    }
  }

  // Postgres catalog
  for (const m of METRIC_CATALOG.postgres) {
    await runIfDiscovered(m as any, pgMetricNames)
  }

  // Redis catalog
  for (const m of METRIC_CATALOG.redis) {
    await runIfDiscovered(m as any, redisMetricNames)
  }

  // Cadvisor / containers
  for (const m of METRIC_CATALOG.cadvisor) {
    await runIfDiscovered(m as any, cadvisorMetricNames)
  }

  // Generic infra catalog
  for (const m of METRIC_CATALOG.infrastructure) {
    // choose discovered set based on metric hint
    const possibleDiscovered = m.key.includes('postgres') ? pgMetricNames : m.key.includes('redis') ? redisMetricNames : cadvisorMetricNames
    await runIfDiscovered(m as any, possibleDiscovered)
  }

  return metrics
}

export async function fetchRedisMetrics(): Promise<RedisMetric[]> {
  const results: RedisMetric[] = []
  for (const m of METRIC_CATALOG.redis) {
    try {
      const r = await safeInstant(m.promql)
      if (r.length > 0) {
        results.push({ name: m.key, value: r[0].value[1], unit: m.unit ?? '', delta: 'n/a' })
      }
    } catch (e) {
      // ignore
    }
  }

  return results
}

export async function fetchPostgresMetrics(): Promise<PostgresMetric[]> {
  const results: PostgresMetric[] = []
  for (const m of METRIC_CATALOG.postgres) {
    try {
      const r = await safeInstant(m.promql)
      if (r.length > 0) {
        results.push({ name: m.key, value: r[0].value[1], unit: m.unit ?? '', delta: 'n/a' })
      }
    } catch (e) {
      // ignore
    }
  }

  return results
}

export async function fetchWorkerStatus(): Promise<WorkerStatus[]> {
  // Worker status is not exported by Prometheus in this compose by default.
  // Return empty - rely on other health probes or add instrumentation server-side.
  return []
}
