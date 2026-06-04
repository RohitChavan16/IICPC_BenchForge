import { useQuery } from '@tanstack/react-query'
import { fetchPostgresMetrics } from '@/services/api/infraService'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function PostgresMonitoringPage() {
  const { data: metrics, isLoading, isError } = useQuery({ queryKey: ['postgresMetrics'], queryFn: fetchPostgresMetrics })

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">PostgreSQL observability</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">PostgreSQL monitoring</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="PostgreSQL metrics" description="Transactions, cache, and write performance.">
          {isLoading ? (
            <div className="p-6 text-muted-foreground">Loading PostgreSQL metrics...</div>
          ) : isError ? (
            <div className="p-6 text-red-400">Failed to load PostgreSQL metrics from Prometheus.</div>
          ) : (
            <div className="grid gap-4">
              {(metrics ?? []).map((metric) => (
                <div key={metric.name} className="rounded-3xl border border-border bg-background p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{metric.name}</p>
                    <Badge variant="info">{metric.unit}</Badge>
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-foreground">{metric.value}</p>
                  <p className="mt-2 text-sm text-foreground0">Trend {metric.delta}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="Database stability" description="Monitoring and alert readiness.">
          <div className="space-y-3 text-muted-foreground">
            <p>PostgreSQL telemetry is integrated through exporter metrics and event persistence.</p>
            <p>Monitor cache hit ratio, transaction throughput, and connection saturation.</p>
            <p className="text-sm text-foreground0">This dashboard is designed for backend engineers and DBAs.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
