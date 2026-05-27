import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchHealthStatus, fetchInfrastructureMetrics } from '@/services/api/infraService'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function InfrastructureMonitoringPage() {
  const { data: healthStatus } = useQuery(['healthStatus'], fetchHealthStatus)
  const { data: metrics } = useQuery(['infrastructureMetrics'], fetchInfrastructureMetrics)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Infrastructure monitor</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Infrastructure monitoring</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Infrastructure metrics" description="Core platform health and resource velocity.">
          <div className="grid gap-4 md:grid-cols-2">
            {(metrics ?? []).map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-white/10 bg-slate-950/75 p-5">
                <div className="flex items-center justify-between gap-3 text-slate-400">
                  <p>{metric.label}</p>
                  <Badge variant={metric.trend === 'up' ? 'warning' : metric.trend === 'down' ? 'success' : 'info'}>{metric.trend}</Badge>
                </div>
                <p className="mt-4 text-3xl font-semibold text-white">{metric.value}</p>
                <p className="mt-2 text-sm text-slate-500">{metric.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="System health" description="Critical cluster status and alerts.">
          <div className="space-y-4">
            {(healthStatus ?? []).map((status) => (
              <div key={status.label} className="rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">{status.label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{status.details}</p>
                  </div>
                  <Badge variant={status.status === 'Healthy' ? 'success' : status.status === 'Warning' ? 'warning' : 'danger'}>{status.status}</Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-3">
            <Link to="/infrastructure/redis" className="rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-4 text-sm text-cyan-300 transition hover:bg-white/5">
              View Redis observability
            </Link>
            <Link to="/infrastructure/postgres" className="rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-4 text-sm text-cyan-300 transition hover:bg-white/5">
              View PostgreSQL observability
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
