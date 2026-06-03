import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formatNumber, formatPercent } from '@/utils/formatters'
import { fetchHealthStatus, fetchInfrastructureMetrics } from '@/services/api/infraService'
import { fetchTelemetrySummary } from '@/services/api/telemetryService'
import { fetchBenchmarkSessions } from '@/services/api/benchmarkService'
import { Card } from '@/components/ui/Card'
import { MetricSparkline } from '@/components/charts/MetricSparkline'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { Badge } from '@/components/ui/Badge'
import { Info, ShieldCheck, TrendingUp, Zap, Play, Rocket } from 'lucide-react'

export function DashboardHomePage() {
  const { data: summary } = useQuery({ queryKey: ['telemetrySummary'], queryFn: fetchTelemetrySummary })
  const { data: healthStatus } = useQuery({ queryKey: ['healthStatus'], queryFn: fetchHealthStatus })
  const { data: infrastructure } = useQuery({ queryKey: ['infrastructureMetrics'], queryFn: fetchInfrastructureMetrics })
  const { data: benchmarksData } = useQuery({ 
    queryKey: ['benchmarks'], 
    queryFn: fetchBenchmarkSessions,
    refetchInterval: (query) => {
      const active = (query.state.data as any)?.items?.filter((b: any) => b.status === 'RUNNING' || b.status === 'QUEUED' || b.status === 'CREATED').length
      return active ? 3000 : 15000
    }
  })

  const activeBenchmarks = benchmarksData?.items.filter(b => b.status === 'RUNNING' || b.status === 'CREATED') || []
  const hasActiveBenchmark = activeBenchmarks.length > 0

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="space-y-6" title="Overview" description="Active telemetry, throughput, and platform health." >
          {hasActiveBenchmark ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-slate-950/75 p-6">
                  <p className="text-sm text-slate-400">Throughput</p>
                  <div className="mt-4 flex items-end gap-3">
                    <span className="text-5xl font-semibold text-cyan-300">{summary ? formatNumber(summary.tps) : '--'}</span>
                    <span className="rounded-3xl bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">TPS</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">Real-time request volume across the benchmark fleet.</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-slate-950/75 p-6">
                  <p className="text-sm text-slate-400">Latency p99</p>
                  <div className="mt-4 flex items-end gap-3">
                    <span className="text-5xl font-semibold text-violet-300">{summary ? `${formatNumber(summary.p99)} ms` : '--'}</span>
                    <span className="rounded-3xl bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">Fast</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">High percentile latency gives you early warning of tail performance.</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[28px] border border-white/10 bg-slate-950/75 p-6">
                  <div className="flex items-center gap-3 text-slate-400">
                    <TrendingUp size={18} />
                    <p className="text-sm uppercase tracking-[0.24em]">Success rate</p>
                  </div>
                  <p className="mt-4 text-4xl font-semibold text-emerald-300">{summary ? formatPercent(summary.failureRate ? 100 - summary.failureRate : 99.9) : '--'}</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-slate-950/75 p-6">
                  <div className="flex items-center gap-3 text-slate-400">
                    <ShieldCheck size={18} />
                    <p className="text-sm uppercase tracking-[0.24em]">Failure rate</p>
                  </div>
                  <p className="mt-4 text-4xl font-semibold text-rose-300">{summary ? formatPercent(summary.failureRate) : '--'}</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-slate-950/75 p-6">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Zap size={18} />
                    <p className="text-sm uppercase tracking-[0.24em]">Total Requests</p>
                  </div>
                  <p className="mt-4 text-4xl font-semibold text-white">{summary ? formatNumber(summary.total) : '--'}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-slate-950/75 p-12 text-center">
              <div className="mb-4 rounded-full bg-cyan-500/10 p-4 text-cyan-400">
                <Rocket size={32} />
              </div>
              <h3 className="text-xl font-semibold text-white">System Idle</h3>
              <p className="mt-2 max-w-md text-slate-400">
                There are no active benchmarks currently running. You can initiate a new benchmark against a mock target or a live deployment to generate load.
              </p>
              <div className="mt-6 flex gap-4">
                <Link to="/benchmarks/new" className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-400 transition-colors">
                  <Play size={16} />
                  Run Benchmark
                </Link>
                <Link to="/deployments/new" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                  Deploy Engine
                </Link>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card title="Platform health" description="Critical subsystem status across telemetry, Redis, and PostgreSQL.">
            <div className="space-y-3">
              {(healthStatus ?? []).map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                  <div>
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="mt-1 text-base font-semibold text-white">{item.status}</p>
                  </div>
                  <Badge variant={item.status === 'Healthy' ? 'success' : item.status === 'Warning' ? 'warning' : 'danger'}>{item.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Operational insight" description="Live monitoring recommendations and platform state.">
            <div className="flex items-center gap-3 text-slate-400">
              <Info size={18} />
              <p className="text-sm">High-fidelity stream updates are active. No critical degradations detected.</p>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card title="Request distribution" description="Latency distribution trend in the last 20 intervals.">
          <div className="mt-4">
            <MetricSparkline data={summary ? [
              { timestamp: new Date().toISOString(), tps: summary.tps, p50: summary.p50, p90: summary.p90, p99: summary.p99, failureRate: summary.failureRate, total: summary.total },
            ] : []} dataKey="p90" />
          </div>
        </Card>
        <Card title="Resource contour" description="CPU and memory pressure indicators.">
          <div className="mt-4 grid gap-4">
            {infrastructure?.slice(0, 2).map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <p className="text-sm text-slate-400">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                <p className="mt-1 text-sm text-slate-500">{metric.detail}</p>
              </div>
            ))}
          </div>
        </Card>
        <ActivityFeed />
      </section>
    </div>
  )
}
