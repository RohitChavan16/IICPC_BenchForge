import { Rocket, RotateCcw, Power } from 'lucide-react'

import { OperationsPageContainer } from '../../components/admin/operations/OperationsPageContainer'
import { OperationsHero } from '../../components/admin/operations/OperationsHero'
import { OperationsSection } from '../../components/admin/operations/OperationsSection'

import { DeploymentKPICards } from './deployments/DeploymentKPICards'
import { ActiveSubmissionDeployments } from './deployments/ActiveSubmissionDeployments'
import { DeploymentHealth } from './deployments/DeploymentHealth'
import { LiveDeploymentActivity } from './deployments/LiveDeploymentActivity'

export function AdminDeploymentsPage() {
  return (
    <OperationsPageContainer>
      {/* 1. Hero Section */}
      <OperationsHero
        title="Deployment Operations Center"
        description="Monitor, manage, and rollback contestant submission containers across execution environments."
        icon={<Rocket size={36} />}
        accentColor="emerald"
        badges={[
          { label: 'Active Containers', value: '42', color: 'emerald' },
          { label: 'Success Rate', value: '98.5%', color: 'blue' },
          { label: 'Avg MTTR', value: '4m 12s', color: 'slate' }
        ]}
        actions={
          <>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700 font-medium text-sm w-full sm:w-auto justify-center shadow-sm">
              <Power size={16} className="text-rose-500" />
              Halt All Deployments
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors border border-emerald-500 font-medium text-sm w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <RotateCcw size={16} />
              Re-sync State
            </button>
          </>
        }
      />

      {/* 2. KPI Section */}
      <OperationsSection
        title="Deployment Metrics"
        description="Deployment frequency, lead times, and reliability tracking."
        tooltipContent="Tracks DORA-style metrics for submission deployment processes."
        lastUpdated="Just now"
        alternateBg={false}
      >
        <DeploymentKPICards />
      </OperationsSection>

      {/* 3. Main Operations Section */}
      <OperationsSection
        title="Active Submission Deployments"
        description="Current ledger of all active contestant containers and their runtime statuses."
        tooltipContent="Data table displaying running containers, images, and mapped ports."
        lastUpdated="1m ago"
        alternateBg={true}
      >
        <ActiveSubmissionDeployments />
      </OperationsSection>

      {/* 4. Analytics Section */}
      <OperationsSection
        title="Deployment Health Analytics"
        description="Compare deployment latencies, failure rates, and stage times."
        tooltipContent="Visualizes failure rates and container initialization times."
        alternateBg={false}
      >
        <DeploymentHealth />
      </OperationsSection>

      {/* 5. Activity Section */}
      <OperationsSection
        title="Live Deployment Feed"
        description="Real-time events for container builds, artifacts, and registry uploads."
        tooltipContent="Chronological feed of deployment steps."
        alternateBg={true}
      >
        <LiveDeploymentActivity />
      </OperationsSection>

    </OperationsPageContainer>
  )
}
