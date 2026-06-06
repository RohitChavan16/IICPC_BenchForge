import { Activity, ShieldAlert, Cpu, Database } from 'lucide-react'
import { OperationsKPIGrid } from '../../../components/admin/operations/OperationsKPIGrid'
import type { KPICardData } from '../../../components/admin/operations/OperationsKPIGrid'
import { formatNumber } from '../../../utils/formatters'

interface WorkerKPICardsProps {
  totals: { tps: number; total: number; failures: number }
  workerCount: number
  wsStatus?: string
}

export function WorkerKPICards({ totals, workerCount }: WorkerKPICardsProps) {
  const kpiData: KPICardData[] = [
    { id: 'tps', label: 'Pool TPS', value: formatNumber(totals.tps), explanation: 'Aggregate transactions per second across all active workers.', trend: 'High Load', trendType: 'up', icon: <Activity size={18} />, colorClass: 'text-blue-500' },
    { id: 'total', label: 'Total Executions', value: formatNumber(totals.total), explanation: 'All historical executions processed by the current pool.', trend: 'Continuous', trendType: 'neutral', icon: <Database size={18} />, colorClass: 'text-indigo-500' },
    { id: 'failures', label: 'Error Rate', value: `${(totals.failures / (workerCount || 1)).toFixed(2)}%`, explanation: 'Average failure rate across the worker pool.', trend: 'Optimal', trendType: 'down', icon: <ShieldAlert size={18} />, colorClass: 'text-emerald-500' },
    { id: 'cpu', label: 'Global CPU', value: '42%', explanation: 'Average CPU utilization across all nodes.', trend: 'Healthy', trendType: 'neutral', icon: <Cpu size={18} />, colorClass: 'text-cyan-500' },
  ]

  return <OperationsKPIGrid metrics={kpiData} />
}
