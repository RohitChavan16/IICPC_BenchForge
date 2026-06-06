import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cpu, RefreshCw, ShieldAlert } from 'lucide-react'
import { fetchWorkers } from '@/services/api/workerService'
import { useWebsocket } from '@/hooks/useWebsocket'
import type { WorkerMetricSnapshot, WorkerStatus } from '@/types/api'

import { OperationsPageContainer } from '../../components/admin/operations/OperationsPageContainer'
import { OperationsHero } from '../../components/admin/operations/OperationsHero'
import { OperationsSection } from '../../components/admin/operations/OperationsSection'

import { WorkerKPICards } from './workers/WorkerKPICards'
import { WorkerHealthMatrix } from './workers/WorkerHealthMatrix'
import { ExecutionDistribution } from './workers/ExecutionDistribution'
import { LiveWorkerActivity } from './workers/LiveWorkerActivity'

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

export function AdminWorkersPage() {
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
    if (samples.length === 0) return

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

  const activeCount = workers.filter(w => w.status === 'Active').length
  const idleCount = workers.filter(w => w.status === 'Idle').length

  return (
    <OperationsPageContainer>
      {/* 1. Hero Section */}
      <OperationsHero
        title="Worker Pool Orchestration"
        description="Monitor compute resources, worker health, and platform execution capacity."
        icon={<Cpu size={36} />}
        accentColor="blue"
        badges={[
          { label: 'Total Workers', value: workers.length.toString(), color: 'blue' },
          { label: 'Active', value: activeCount.toString(), color: 'emerald' },
          { label: 'Idle', value: idleCount.toString(), color: 'slate' }
        ]}
        actions={
          <>
            <button 
              onClick={() => { void refetch(); reconnect(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 font-medium text-sm w-full sm:w-auto justify-center shadow-sm"
            >
              <RefreshCw size={16} className={status === 'connecting' ? 'animate-spin' : ''} />
              Sync State
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors border border-blue-500 font-medium text-sm w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <Cpu size={16} />
              Provision Node
            </button>
          </>
        }
      />

      {/* 2. KPI Section */}
      <OperationsSection
        title="Pool Performance Metrics"
        description="Aggregated throughput, request totals, and failure rates across the cluster."
        tooltipContent="Real-time aggregation of worker capabilities."
        lastUpdated="Live"
        alternateBg={false}
      >
        <WorkerKPICards totals={totals} workerCount={workers.length} wsStatus={status} />
      </OperationsSection>

      {/* 3. Main Operations Section */}
      <OperationsSection
        title="Worker Health Matrix"
        description="Live view of all connected worker nodes. Benchmark workers are highlighted."
        tooltipContent="Grid visualization of worker states and assignments."
        lastUpdated="Live"
        alternateBg={true}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <RefreshCw className="animate-spin mr-2" size={16} /> Loading worker fleet...
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-32 text-rose-500 border border-rose-200 dark:border-rose-900/30 rounded-xl bg-rose-50 dark:bg-rose-950/20">
            <ShieldAlert className="mr-2" size={16} /> Unable to load worker fleet. Waiting for stream...
          </div>
        ) : workers.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            No workers reported by the backend yet.
          </div>
        ) : (
          <WorkerHealthMatrix 
            workers={workers} 
            selectedWorkerId={selectedWorkerId} 
            onSelectWorker={setSelectedWorkerId} 
          />
        )}
      </OperationsSection>

      {/* 4. Analytics Section */}
      <OperationsSection
        title="Execution Distribution"
        description="Analyze load balancing and individual worker metrics."
        tooltipContent="Charts and distribution graphs showing load share."
        alternateBg={false}
      >
        <ExecutionDistribution 
          workers={workers} 
          selectedWorkerId={selectedWorker} 
          history={selectedWorker ? histories[selectedWorker] ?? [] : []} 
        />
      </OperationsSection>

      {/* 5. Activity Section */}
      <OperationsSection
        title="Live Worker Telemetry"
        description="Real-time events for connection drops, re-balancing, and scaling events."
        tooltipContent="Chronological feed of cluster lifecycle events."
        alternateBg={true}
      >
        <LiveWorkerActivity />
      </OperationsSection>

    </OperationsPageContainer>
  )
}
