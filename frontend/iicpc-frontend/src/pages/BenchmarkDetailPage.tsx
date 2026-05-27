import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchBenchmarkDetail } from '@/services/api/benchmarkService'
import { fetchTelemetryHistory } from '@/services/api/telemetryService'
import { Card } from '@/components/ui/Card'
import { LiveLineChart } from '@/components/charts/LiveLineChart'
import { Badge } from '@/components/ui/Badge'
import { formatPercent } from '@/utils/formatters'

export function BenchmarkDetailPage() {
  const { benchmarkId } = useParams()
  const navigate = useNavigate()
  const { data: benchmark } = useQuery(['benchmarkDetail', benchmarkId], () => fetchBenchmarkDetail(benchmarkId ?? ''), { enabled: Boolean(benchmarkId) })
  const { data: history } = useQuery(['telemetryHistory'], fetchTelemetryHistory)

  const summary = useMemo(() => {
    if (!benchmark) return null
    return [
      { label: 'TPS', value: benchmark.metrics.tps.toFixed(0) },
      { label: 'p99 latency', value: `${benchmark.metrics.p99} ms` },
      { label: 'Success', value: formatPercent(benchmark.metrics.successRate) },
    ]
  }, [benchmark])

  if (!benchmark) {
    return (
      <div className="mx-auto max-w-4xl py-16 text-center text-white">
        <p className="text-xl">Session not found.</p>
        <button
          type="button"
          onClick={() => navigate('/benchmarks')}
          className="mt-6 rounded-3xl border border-white/10 bg-cyan-500/10 px-6 py-3 text-sm text-cyan-300 transition hover:bg-cyan-500/20"
        >
          Return to sessions
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Session detail</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{benchmark.name}</h1>
        </div>
        <Badge variant={benchmark.status === 'Completed' ? 'success' : benchmark.status === 'Failed' ? 'danger' : benchmark.status === 'Running' ? 'info' : 'warning'}>
          {benchmark.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-6">
          <Card title="Live telemetry" description="Last 20 seconds of stream data.">
            <LiveLineChart data={history ?? []} />
          </Card>

          <Card title="Benchmark summary" description="Real-time metrics and worker behavior.">
            <div className="grid gap-4 sm:grid-cols-3">
              {summary?.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-slate-950/75 p-5 text-white">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Session metadata" description="Orchestration details and benchmark notes.">
            <div className="space-y-4 text-sm text-slate-300">
              <div className="grid gap-2 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <p className="text-slate-400">Started</p>
                <p>{new Date(benchmark.startedAt).toLocaleString()}</p>
              </div>
              <div className="grid gap-2 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <p className="text-slate-400">Duration</p>
                <p>{benchmark.duration}</p>
              </div>
              <div className="grid gap-2 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <p className="text-slate-400">Worker pool</p>
                <p>{benchmark.workerCount} workers</p>
              </div>
            </div>
          </Card>

          <Card title="Benchmark logs" description="Recent command and runtime events.">
            <div className="space-y-3 text-sm text-slate-300">
              <p>{benchmark.description}</p>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Control plane note</p>
                <p className="mt-2 text-sm text-slate-300">The benchmark is configured for mixed traffic with Redis streams and PostgreSQL persistence.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
