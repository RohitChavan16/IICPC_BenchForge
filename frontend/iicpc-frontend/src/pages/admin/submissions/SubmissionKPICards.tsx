import { FileCode, PlayCircle, Layers, CheckCircle2, XCircle, Activity, Target, Zap } from 'lucide-react'
import { OperationsKPIGrid } from '../../../components/admin/operations/OperationsKPIGrid'
import type { KPICardData } from '../../../components/admin/operations/OperationsKPIGrid'

const kpiData: KPICardData[] = [
  { id: 'total', label: 'Total Submissions', value: '12,450', explanation: 'All historical submissions recorded by the platform.', trend: '+14% this week', trendType: 'up', icon: <FileCode size={18} />, colorClass: 'text-indigo-500' },
  { id: 'running', label: 'Running Benchmarks', value: '42', explanation: 'Jobs currently executing on worker nodes.', trend: 'Optimal capacity', trendType: 'neutral', icon: <PlayCircle size={18} />, colorClass: 'text-blue-500' },
  { id: 'queued', label: 'Queued Jobs', value: '105', explanation: 'Jobs waiting to be picked up by an available worker.', trend: '~4m wait time', trendType: 'down', icon: <Layers size={18} />, colorClass: 'text-amber-500' },
  { id: 'success', label: 'Successful Builds', value: '11,802', explanation: 'Submissions that successfully compiled and passed basic validation.', trend: '94.8% success rate', trendType: 'up', icon: <CheckCircle2 size={18} />, colorClass: 'text-emerald-500' },
  { id: 'failed', label: 'Failed Builds', value: '648', explanation: 'Submissions that failed to compile or crashed.', trend: '5.2% failure rate', trendType: 'down', icon: <XCircle size={18} />, colorClass: 'text-rose-500' },
  { id: 'tps', label: 'Average TPS', value: '4,102', explanation: 'Platform-wide Transactions Per Second across all active benchmarks.', trend: '+205 from yesterday', trendType: 'up', icon: <Activity size={18} />, colorClass: 'text-cyan-500' },
  { id: 'correctness', label: 'Avg Correctness', value: '98.4%', explanation: 'Average correctness score across all validated submissions.', trend: 'Consistently high', trendType: 'neutral', icon: <Target size={18} />, colorClass: 'text-teal-500' },
  { id: 'concurrency', label: 'Avg Concurrency', value: '92', explanation: 'Average number of concurrent requests handled successfully.', trend: 'Target: 100', trendType: 'neutral', icon: <Zap size={18} />, colorClass: 'text-violet-500' },
]

export function SubmissionKPICards() {
  return <OperationsKPIGrid metrics={kpiData} />
}

