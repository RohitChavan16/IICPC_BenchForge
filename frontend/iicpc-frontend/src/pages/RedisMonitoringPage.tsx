import { useQuery } from '@tanstack/react-query'
import { fetchRedisMetrics } from '@/services/api/infraService'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function RedisMonitoringPage() {
  const { data: metrics } = useQuery(['redisMetrics'], fetchRedisMetrics)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Redis observability</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Redis monitoring</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Redis metrics" description="Command load, memory and client state.">
          <div className="grid gap-4">
            {(metrics ?? []).map((metric) => (
              <div key={metric.name} className="rounded-3xl border border-white/10 bg-slate-950/75 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">{metric.name}</p>
                  <Badge variant="info">{metric.unit}</Badge>
                </div>
                <p className="mt-4 text-3xl font-semibold text-white">{metric.value}</p>
                <p className="mt-2 text-sm text-slate-500">Trend {metric.delta}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Redis health" description="Sliding window and operational visibility.">
          <div className="space-y-3 text-slate-400">
            <p>Redis is instrumented to export metrics for Prometheus.</p>
            <p>Live streaming dashboards should flow through the telemetry pipeline and Redis exporter.</p>
            <p className="text-sm text-slate-500">Use Grafana for deeper PromQL queries when available.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
