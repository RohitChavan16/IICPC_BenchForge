import { PlayCircle, Server, BarChart3, FileCode } from 'lucide-react'
import { OperationsPageContainer } from '../../components/admin/operations/OperationsPageContainer'
import { OperationsHero } from '../../components/admin/operations/OperationsHero'
import { OperationsSection } from '../../components/admin/operations/OperationsSection'

import { SubmissionKPICards } from './submissions/SubmissionKPICards'
import { SubmissionFilters } from './submissions/SubmissionFilters'
import { SubmissionTable } from './submissions/SubmissionTable'
import { PipelineHealthCard } from './submissions/PipelineHealthCard'
import { LiveSubmissionActivity } from './submissions/LiveSubmissionActivity'
import { TopPerformersCard } from './submissions/TopPerformersCard'

export function AdminSubmissionsPage() {
  return (
    <OperationsPageContainer>
      {/* 1. Hero Section */}
      <OperationsHero
        title="Submission Operations Center"
        description="Monitor, inspect, troubleshoot and manage every submission across the platform."
        icon={<FileCode size={36} />}
        accentColor="indigo"
        badges={[
          { label: 'Total', value: '12,450', color: 'slate' },
          { label: 'Running', value: '42', color: 'cyan' },
          { label: 'Queued', value: '105', color: 'amber' },
          { label: 'Failed', value: '12', color: 'rose' }
        ]}
        actions={
          <>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 font-medium text-sm w-full sm:w-auto justify-center shadow-sm">
              <Server size={16} className="text-amber-500" />
              View Queue
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 font-medium text-sm w-full sm:w-auto justify-center shadow-sm">
              <PlayCircle size={16} className="text-cyan-500" />
              Open Pipeline
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors border border-indigo-500 font-medium text-sm w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]">
              <BarChart3 size={16} />
              Open Leaderboard
            </button>
          </>
        }
      />

      {/* 2. KPI Section */}
      <OperationsSection
        title="Global Submission KPIs"
        description="High level platform submission metrics and volume indicators."
        tooltipContent="Provides real-time aggregated metrics for all submission traffic on the platform."
        lastUpdated="Just now"
        alternateBg={false}
      >
        <SubmissionKPICards />
      </OperationsSection>

      {/* 3. Main Operations Section */}
      <OperationsSection
        title="Submission Control Center"
        description="Search, filter, and drill down into individual workloads."
        tooltipContent="The primary interface for locating and managing specific submissions based on multiple filter criteria."
        lastUpdated="1m ago"
        alternateBg={true}
      >
        <div className="flex flex-col gap-6">
          <SubmissionFilters />
          <SubmissionTable />
        </div>
      </OperationsSection>

      {/* 4. Analytics Section */}
      <OperationsSection
        title="Pipeline & Performance Analytics"
        description="Health metrics across the evaluation lifecycle and top performing teams."
        tooltipContent="Monitors stage-by-stage pipeline health and highlights current benchmark leaders."
        alternateBg={false}
      >
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          <div className="xl:col-span-2 h-full">
            <PipelineHealthCard />
          </div>
          <div className="xl:col-span-1 h-full">
            <TopPerformersCard />
          </div>
        </div>
      </OperationsSection>

      {/* 5. Activity Section */}
      <OperationsSection
        title="Live Submission Activity"
        description="Real-time operational events across the benchmarking platform."
        tooltipContent="A chronological feed of events, state transitions, and anomalies across the cluster."
        alternateBg={true}
      >
        <LiveSubmissionActivity />
      </OperationsSection>
    </OperationsPageContainer>
  )
}

