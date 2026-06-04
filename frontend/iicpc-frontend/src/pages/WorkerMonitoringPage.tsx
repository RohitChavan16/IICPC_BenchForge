import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, Wifi } from 'lucide-react'
import { fetchWorkers } from '@/services/api/workerService'
import { useWebsocket } from '@/hooks/useWebsocket'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { WorkerCard } from '@/components/workers/WorkerCard'
import { WorkerMetricsChart } from '@/components/workers/WorkerMetricsChart'
import { WorkerStatusPanel } from '@/components/workers/WorkerStatusPanel'
import type { WorkerMetricSnapshot, WorkerStatus } from '@/types/api'
import { formatNumber } from '@/utils/formatters'

const HISTORY_LIMIT = 30

function mergeWorkerData(initialWorkers: WorkerStatus[], liveWorkers: Record<string, WorkerMetricSnapshot>) {
  const byId = new Map(initialWorkers.map((worker) => [worker.workerId, worker]))

  Object.entries(liveWorkers).forEach(([workerId, snapshot]) => {
    const existing = byId.get(workerId)
    byId.set(workerId, {
      workerId,
      status: existing?.status ?? 'Active',
      lastSeen: existing?.lastSeen ?? snapshot.timestamp,
      tps: snapshot.tps,
      p50: snapshot.p50,
      p90: snapshot.p90,
      p99: snapshot.p99,
      failureRate: snapshot.failureRate,
      total: snapshot.total,
    })
  })

  return Array.from(byId.values()).sort((left, right) => left.workerId.localeCompare(right.workerId))
}

export function WorkerMonitoringPage() {
  const { status, workers: liveWorkers, reconnect } = useWebsocket()
  const { data: initialWorkers = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['workers'],
    queryFn: fetchWorkers,
    refetchInterval: 15000,
  })
  const [histories, setHistories] = useState<Record<string, WorkerMetricSnapshot[]>>({})
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)

  useEffect(() => {
    const samples = Object.values(liveWorkers)
    if (samples.length === 0) {
      return
    }

    setHistories((current) => {
      const next = { ...current }
      samples.forEach((sample) => {
        const history = next[sample.workerId] ?? []
        next[sample.workerId] = [...history, sample].slice(-HISTORY_LIMIT)
      })
      return next
    })
  }, [liveWorkers])

  const workers = useMemo(() => mergeWorkerData(initialWorkers, liveWorkers), [initialWorkers, liveWorkers])
  const selectedWorker = selectedWorkerId && workers.some((worker) => worker.workerId === selectedWorkerId)
    ? selectedWorkerId
    : workers[0]?.workerId ?? null

  useEffect(() => {
    if (!selectedWorkerId && selectedWorker) {
      setSelectedWorkerId(selectedWorker)
    }
  }, [selectedWorker, selectedWorkerId])

  const totals = useMemo(() => workers.reduce(
    (acc, worker) => ({
      tps: acc.tps + worker.tps,
      total: acc.total + worker.total,
      failures: acc.failures + worker.failureRate,
    }),
    { tps: 0, total: 0, failures: 0 },
  ), [workers])

  const connectionVariant = status === 'connected' ? 'success' : status === 'connecting' ? 'info' : status === 'error' ? 'danger' : 'warning'

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Worker observability</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Worker monitoring</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={connectionVariant}>{status}</Badge>
          <button
            type="button"
            onClick={() => {
              void refetch()
              reconnect()
            }}
            className="inline-flex items-center gap-2 rounded-3xl border border-border bg-card px-4 py-3 text-sm text-foreground transition hover:bg-muted"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted-foreground">Workers</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{workers.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Pool TPS</p>
          <p className="mt-3 text-3xl font-semibold text-primary">{formatNumber(totals.tps)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Total requests</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-300">{formatNumber(totals.total)}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.45fr]">
        <Card title="Worker pool health" description="Real worker state from GET /workers merged with live WebSocket metrics.">
          {isLoading ? (
            <div className="rounded-3xl border border-border bg-background p-5 text-muted-foreground">Loading workers from backend.</div>
          ) : isError ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-950/20 p-5 text-rose-200">Unable to load GET /workers. Live worker samples will appear when the stream publishes them.</div>
          ) : workers.length === 0 ? (
            <div className="rounded-3xl border border-border bg-background p-5 text-muted-foreground">No workers reported by the backend yet.</div>
          ) : (
            <div className="grid gap-4">
              {workers.map((worker) => (
                <button
                  key={worker.workerId}
                  type="button"
                  onClick={() => setSelectedWorkerId(worker.workerId)}
                  className={`text-left transition ${selectedWorker === worker.workerId ? 'rounded-3xl ring-2 ring-cyan-300/50' : 'rounded-3xl hover:ring-1 hover:ring-white/20'}`}
                >
                  <WorkerCard worker={worker} />
                </button>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Status" description="Active, idle, and offline worker distribution.">
            <WorkerStatusPanel workers={workers} />
          </Card>
          <Card title="Stream" description="Realtime worker payload availability.">
            <div className="rounded-3xl border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <Wifi size={18} className="text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Worker samples</p>
                  <p className="mt-1 text-sm text-muted-foreground">{Object.keys(liveWorkers).length} workers in latest WebSocket payload.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card title="Worker metrics" description={selectedWorker ? `Live trends for ${selectedWorker}.` : 'Select a worker to inspect live trends.'}>
        {selectedWorker ? (
          <WorkerMetricsChart workerId={selectedWorker} data={histories[selectedWorker] ?? []} />
        ) : (
          <div className="rounded-3xl border border-border bg-background p-5 text-muted-foreground">No worker selected.</div>
        )}
      </Card>
    </div>
  )
}
