import { Layers, Activity, Clock, ShieldAlert } from 'lucide-react'
import { OperationsKPIGrid } from '../../../components/admin/operations/OperationsKPIGrid'
import type { KPICardData } from '../../../components/admin/operations/OperationsKPIGrid'

const kpiData: KPICardData[] = [
  { id: 'depth', label: 'Queue Depth', value: '4,102', explanation: 'Pending workloads waiting for execution across all stages.', trend: '+12% from last hour', trendType: 'up', icon: <Layers size={18} />, colorClass: 'text-amber-500' },
  { id: 'throughput', label: 'Throughput', value: '850/s', explanation: 'Number of jobs successfully processed and dequeued per second.', trend: 'Stable', trendType: 'neutral', icon: <Activity size={18} />, colorClass: 'text-cyan-500' },
  { id: 'wait', label: 'Avg Wait Time', value: '1.2s', explanation: 'Average time a job spends in the queue before processing starts.', trend: '-0.3s from yesterday', trendType: 'down', icon: <Clock size={18} />, colorClass: 'text-emerald-500' },
  { id: 'dlq', label: 'Dead Letter Queue', value: '24', explanation: 'Jobs that failed to process after maximum retries.', trend: '+2 new', trendType: 'up', icon: <ShieldAlert size={18} />, colorClass: 'text-rose-500' },
]

export function QueueKPICards() {
  return <OperationsKPIGrid metrics={kpiData} />
}
