import { useQuery } from '@tanstack/react-query'
import { fetchWorkerStatus } from '@/services/api/infraService'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Cpu, Activity, AlertCircle } from 'lucide-react'

const statusVariant = {
  Active: 'success',
  Idle: 'info',
  Degraded: 'warning',
  Offline: 'danger',
} as const

export function WorkerMonitoringPage() {
  const { data: workers } = useQuery(['workerStatus'], fetchWorkerStatus)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Worker observability</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Worker monitoring</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.5fr]">
        <Card title="Worker pool health" description="Active workers, concurrency, and runtime resilience.">
          <div className="grid gap-4">
            {(workers ?? []).map((worker) => (
              <div key={worker.id} className="rounded-3xl border border-white/10 bg-slate-950/75 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-white">{worker.label}</p>
                    <p className="mt-1 text-sm text-slate-400">Last seen {worker.lastSeen.split('T')[0]}</p>
                  </div>
                  <Badge variant={statusVariant[worker.status]}>{worker.status}</Badge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-400">Concurrency</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{worker.concurrency}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-400">Active jobs</p>
                    <p className="mt-2 text-2xl font-semibold text-cyan-300">{worker.activeJobs}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-400">CPU</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{worker.cpu}%</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-400">Memory</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{worker.memory}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Worker metrics" description="Live worker capacity and alerts.">
            <div className="space-y-4 text-sm text-slate-400">
              <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <Activity size={18} className="text-cyan-300" />
                <div>
                  <p className="font-semibold text-white">Pool throughput</p>
                  <p className="mt-1">Optimized worker concurrency is within operational bounds.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <Cpu size={18} className="text-violet-300" />
                <div>
                  <p className="font-semibold text-white">CPU utilization</p>
                  <p className="mt-1">Workers are balanced across cores and memory pressure remains moderate.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <AlertCircle size={18} className="text-amber-300" />
                <div>
                  <p className="font-semibold text-white">Anomaly detection</p>
                  <p className="mt-1">No critical alerts in the last 5 minutes. Watch for degraded pools.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
