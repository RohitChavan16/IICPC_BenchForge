import { useQuery } from '@tanstack/react-query'
import { fetchRedisMetrics } from '@/services/api/infraService'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function RedisMonitoringPage() {
  const { data: metrics, isLoading, isError } = useQuery({ queryKey: ['redisMetrics'], queryFn: fetchRedisMetrics })

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Redis observability</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Redis monitoring</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Redis metrics" description="Command load, memory and client state.">
          {isLoading ? (
            <div className="p-6 text-muted-foreground">Loading Redis metrics...</div>
          ) : isError ? (
            <div className="p-6 text-red-400">Failed to load Redis metrics from Prometheus.</div>
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
        <Card title="Redis health" description="Sliding window and operational visibility.">
          <div className="space-y-3 text-muted-foreground">
            <p>Redis is instrumented to export metrics for Prometheus.</p>
            <p>Live streaming dashboards should flow through the telemetry pipeline and Redis exporter.</p>
            <p className="text-sm text-foreground0">Use Grafana for deeper PromQL queries when available.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
