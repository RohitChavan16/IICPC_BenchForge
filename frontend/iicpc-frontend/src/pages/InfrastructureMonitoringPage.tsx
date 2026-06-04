import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchHealthStatus, fetchInfrastructureMetrics } from '@/services/api/infraService'
import { Card } from '@/components/ui/Card'
import { } from '@/components/ui/Badge'
import { MetricCard } from '@/components/infra/MetricCard'
import { HealthCard } from '@/components/infra/HealthCard'
import { MetricTrendChart } from '@/components/charts/MetricTrendChart'
import { METRIC_CATALOG } from '@/services/prometheus/metricMappings'

export function InfrastructureMonitoringPage() {
  const { data: healthStatus, isLoading: healthLoading, isError: healthError } = useQuery({ queryKey: ['healthStatus'], queryFn: fetchHealthStatus })
  const { data: metrics, isLoading: metricsLoading, isError: metricsError } = useQuery({ queryKey: ['infrastructureMetrics'], queryFn: fetchInfrastructureMetrics })

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Infrastructure monitor</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Infrastructure monitoring</h1>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Infrastructure trends</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">PostgreSQL trends</h3>
            <div className="space-y-4">
              {METRIC_CATALOG.postgres.map((m) => (
                <MetricTrendChart key={m.key} promql={m.promql} title={m.label} unit={m.unit} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm text-muted-foreground mb-2">Redis trends</h3>
            <div className="space-y-4">
              {METRIC_CATALOG.redis.map((m) => (
                <MetricTrendChart key={m.key} promql={m.promql} title={m.label} unit={m.unit} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm text-muted-foreground mb-2">Container trends</h3>
            <div className="space-y-4">
              {METRIC_CATALOG.cadvisor.map((m) => (
                <MetricTrendChart key={m.key} promql={m.promql} title={m.label} unit={m.unit} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Infrastructure metrics" description="Core platform health and resource velocity.">
          {metricsLoading ? (
            <div className="p-6 text-muted-foreground">Loading metrics...</div>
          ) : metricsError ? (
            <div className="p-6 text-red-400">Failed to load metrics from Prometheus.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(metrics ?? []).map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </div>
          )}
        </Card>

        <Card title="System health" description="Critical cluster status and alerts.">
          <div className="space-y-4">
            {healthLoading ? (
              <div className="p-4 text-muted-foreground">Loading health status...</div>
            ) : healthError ? (
              <div className="p-4 text-red-400">Failed to load health status from Prometheus.</div>
            ) : (
              (healthStatus ?? []).map((status) => (
                <HealthCard key={status.label} status={status} />
              ))
            )}
          </div>
          <div className="mt-6 grid gap-3">
            <Link to="/infrastructure/redis" className="rounded-3xl border border-border bg-card px-5 py-4 text-sm text-primary transition hover:bg-muted">
              View Redis observability
            </Link>
            <Link to="/infrastructure/postgres" className="rounded-3xl border border-border bg-card px-5 py-4 text-sm text-primary transition hover:bg-muted">
              View PostgreSQL observability
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
