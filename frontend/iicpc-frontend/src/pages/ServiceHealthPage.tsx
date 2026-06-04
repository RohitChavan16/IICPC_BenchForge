
import { ServiceHealthCard } from '@/components/infra/ServiceHealthCard'

const SERVICES = [
  { label: 'API Gateway', job: 'api-gateway' },
  { label: 'Telemetry Service', job: 'telemetry-service' },
  { label: 'Bot Worker', job: 'bot-worker' },
  { label: 'Mock Exchange', job: 'mock-exchange' },
  { label: 'Postgres', job: 'postgres-exporter' },
  { label: 'Redis', job: 'redis-exporter' },
  { label: 'Prometheus', job: 'prometheus' },
  { label: 'Grafana', job: 'grafana' },
]

export function ServiceHealthPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Service health</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Service health dashboard</h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((s) => (
          <ServiceHealthCard key={s.job} label={s.label} job={s.job} />
        ))}
      </div>
    </div>
  )
}
