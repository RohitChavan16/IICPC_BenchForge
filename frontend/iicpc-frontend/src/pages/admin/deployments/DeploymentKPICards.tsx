import { Rocket, ShieldAlert, Clock, GitMerge } from 'lucide-react'
import { OperationsKPIGrid } from '../../../components/admin/operations/OperationsKPIGrid'
import type { KPICardData } from '../../../components/admin/operations/OperationsKPIGrid'

const kpiData: KPICardData[] = [
  { id: 'frequency', label: 'Deployment Frequency', value: '42/hr', explanation: 'Average number of successful deployments per hour.', trend: '+15% from yesterday', trendType: 'up', icon: <Rocket size={18} />, colorClass: 'text-emerald-500' },
  { id: 'failure', label: 'Failure Rate', value: '1.5%', explanation: 'Percentage of deployments that failed to start or crashed.', trend: 'Well below 5% SLA', trendType: 'down', icon: <ShieldAlert size={18} />, colorClass: 'text-rose-500' },
  { id: 'mttr', label: 'Mean Time To Recovery', value: '4m 12s', explanation: 'Average time to rollback or fix a failed deployment.', trend: '-45s from last week', trendType: 'down', icon: <Clock size={18} />, colorClass: 'text-amber-500' },
  { id: 'lead', label: 'Lead Time for Changes', value: '2m 30s', explanation: 'Average time from code submission to successful deployment.', trend: 'Optimized', trendType: 'neutral', icon: <GitMerge size={18} />, colorClass: 'text-cyan-500' },
]

export function DeploymentKPICards() {
  return <OperationsKPIGrid metrics={kpiData} />
}
