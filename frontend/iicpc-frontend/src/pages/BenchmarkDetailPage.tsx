import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchBenchmarkDetail } from '@/services/api/benchmarkService'
import { fetchTelemetryHistory } from '@/services/api/telemetryService'
import { Card } from '@/components/ui/Card'
import { LiveLineChart } from '@/components/charts/LiveLineChart'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDuration, formatPercent } from '@/utils/formatters'

export function BenchmarkDetailPage() {
  const { benchmarkId } = useParams()
  const navigate = useNavigate()
  const { data: benchmark, isLoading, isError } = useQuery({
    queryKey: ['benchmarkDetail', benchmarkId],
    queryFn: () => fetchBenchmarkDetail(benchmarkId ?? ''),
    enabled: Boolean(benchmarkId),
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status?.toUpperCase()
      return (status === 'RUNNING' || status === 'QUEUED' || status === 'CREATED') ? 2000 : false
    }
  })
  const { data: history } = useQuery({ queryKey: ['telemetryHistory'], queryFn: fetchTelemetryHistory })

  const successRate = benchmark?.totalRequests
    ? (benchmark.successCount / benchmark.totalRequests) * 100
    : 0
  const tps = benchmark?.duration ? benchmark.totalRequests / benchmark.duration : 0
  const durationLabel = benchmark?.duration ? formatDuration(benchmark.duration) : 'In progress'

  const summary = useMemo(() => {
    if (!benchmark) return null
    return [
      { label: 'TPS', value: tps ? tps.toFixed(1) : '—' },
      { label: 'p99 latency', value: `${benchmark.p99.toFixed(0)} ms` },
      { label: 'Success', value: formatPercent(successRate) },
    ]
  }, [benchmark, successRate, tps])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            <Skeleton className="h-80 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !benchmark) {
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
        <div className="flex flex-col items-end gap-1">
          <Badge
            variant={benchmark.status === 'Completed' ? 'success' : benchmark.status === 'Failed' ? 'danger' : benchmark.status === 'Running' ? 'info' : 'warning'}
          >
            {benchmark.status}
          </Badge>
          {benchmark.status === 'Queued' && benchmark.queuePosition !== undefined && benchmark.queuePosition > 0 && (
            <span className="text-sm font-medium text-slate-400">Queue Position #{benchmark.queuePosition}</span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-6">
          <Card title="Live telemetry" description="Last 20 seconds of stream data.">
            <LiveLineChart data={history ?? []} />
          </Card>

          <Card title="Benchmark summary" description="Real-time metrics and run performance.">
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
          <Card title="Session metadata" description="Orchestration details and run counts.">
            <div className="space-y-4 text-sm text-slate-300">
              <div className="grid gap-2 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <p className="text-slate-400">Started</p>
                <p>{new Date(benchmark.startedAt).toLocaleString()}</p>
              </div>
              <div className="grid gap-2 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <p className="text-slate-400">Duration</p>
                <p>{durationLabel}</p>
              </div>
              <div className="grid gap-2 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <p className="text-slate-400">Worker pool</p>
                <p>{benchmark.workerCount} workers</p>
              </div>
              <div className="grid gap-2 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <p className="text-slate-400">Total requests</p>
                <p>{benchmark.totalRequests.toLocaleString()}</p>
              </div>
              <div className="grid gap-2 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <p className="text-slate-400">Failure count</p>
                <p>{benchmark.failureCount.toLocaleString()}</p>
              </div>
              {benchmark.failureReason && (
                <div className="grid gap-2 rounded-3xl border border-red-500/30 bg-red-950/20 p-4">
                  <p className="text-red-400">Failure Reason</p>
                  <p className="text-red-200">{benchmark.failureReason}</p>
                </div>
              )}
              <div className="grid gap-2 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <p className="text-slate-400">Wait time</p>
                <p>{benchmark.waitTimeSeconds !== undefined ? `${benchmark.waitTimeSeconds}s` : '—'}</p>
              </div>
              <div className="grid gap-2 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <p className="text-slate-400">Execution time</p>
                <p>{benchmark.executionTimeSeconds !== undefined ? `${benchmark.executionTimeSeconds}s` : '—'}</p>
              </div>
            </div>
          </Card>

          <Card title="Benchmark metadata" description="Stored run configuration and labels.">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
              {benchmark.metadata && typeof benchmark.metadata === 'object' ? (
                <pre className="whitespace-pre-wrap break-words text-xs text-slate-300">
                  {JSON.stringify(benchmark.metadata, null, 2)}
                </pre>
              ) : (
                <p>No metadata available for this session.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
