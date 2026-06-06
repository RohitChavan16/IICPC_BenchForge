import { ListFilter, PlayCircle, Server, PauseCircle } from 'lucide-react'
import { OperationsPageContainer } from '../../components/admin/operations/OperationsPageContainer'
import { OperationsHero } from '../../components/admin/operations/OperationsHero'
import { OperationsSection } from '../../components/admin/operations/OperationsSection'

import { QueueKPICards } from './queue/QueueKPICards'
import { QueueControlCenter } from './queue/QueueControlCenter'
import { QueueBottleneckAnalysis } from './queue/QueueBottleneckAnalysis'
import { QueueFlowVisualization } from './queue/QueueFlowVisualization'
import { LiveQueueActivity } from './queue/LiveQueueActivity'

export function AdminQueuePage() {
  return (
    <OperationsPageContainer>
      {/* 1. Hero Section */}
      <OperationsHero
        title="Queue Operations Manager"
        description="Monitor, manage, and optimize workload distribution across the execution cluster."
        icon={<ListFilter size={36} />}
        accentColor="cyan"
        badges={[
          { label: 'Queued', value: '4,102', color: 'amber' },
          { label: 'Processing', value: '942', color: 'cyan' },
          { label: 'Avg Wait', value: '1.2s', color: 'slate' }
        ]}
        actions={
          <>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 font-medium text-sm w-full sm:w-auto justify-center shadow-sm">
              <PauseCircle size={16} className="text-amber-500" />
              Pause Queue
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 font-medium text-sm w-full sm:w-auto justify-center shadow-sm">
              <Server size={16} className="text-blue-500" />
              Scale Workers
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors border border-cyan-500 font-medium text-sm w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <PlayCircle size={16} />
              Process DLQ
            </button>
          </>
        }
      />

      {/* 2. KPI Section */}
      <OperationsSection
        title="Queue Performance Metrics"
        description="Throughput, latency, and distribution metrics for active workloads."
        tooltipContent="Tracks how quickly jobs are being processed and highlights stage distribution."
        lastUpdated="Just now"
        alternateBg={false}
      >
        <QueueKPICards />
      </OperationsSection>

      {/* 3. Main Operations Section */}
      <OperationsSection
        title="Queue Control Center"
        description="Inspect and manage individual queued jobs."
        tooltipContent="Data table showing pending, active, and failed jobs. Allows for manual requeueing or cancellation."
        lastUpdated="1m ago"
        alternateBg={true}
      >
        <QueueControlCenter />
      </OperationsSection>

      {/* 4. Analytics Section */}
      <OperationsSection
        title="Queue Health & Topology"
        description="Bottleneck analysis and queue flow visualization."
        tooltipContent="Identifies where jobs are slowing down and visualizes the workload distribution across stages."
        alternateBg={false}
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
          <div className="h-full">
            <QueueFlowVisualization />
          </div>
          <div className="h-full">
            <QueueBottleneckAnalysis />
          </div>
        </div>
      </OperationsSection>

      {/* 5. Activity Section */}
      <OperationsSection
        title="Live Queue Events"
        description="Real-time events for job ingestion, worker assignment, and dead letter queue routing."
        tooltipContent="A chronological feed of significant queue lifecycle events."
        alternateBg={true}
      >
        <LiveQueueActivity />
      </OperationsSection>
    </OperationsPageContainer>
  )
}
