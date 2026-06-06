import { Zap, Activity, Cpu, WifiOff } from 'lucide-react'
import { OperationsActivityFeed } from '../../../components/admin/operations/OperationsActivityFeed'
import type { ActivityFeedItem } from '../../../components/admin/operations/OperationsActivityFeed'

const activityTimeline: ActivityFeedItem[] = [
  { id: 1, title: 'Worker Rebalanced', description: 'Load balancer redistributed 250 requests from node-02 to node-03', time: 'Just now', icon: <Activity size={14} />, colorClass: 'text-blue-500', bgClass: 'bg-blue-500/10', isPulse: true },
  { id: 2, title: 'Benchmark Execution', description: 'node-02 initiated intensive benchmarking phase', time: '3m ago', icon: <Zap size={14} />, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
  { id: 3, title: 'Node Provisioned', description: 'node-04 successfully attached to the worker pool', time: '12m ago', icon: <Cpu size={14} />, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10' },
  { id: 4, title: 'Connection Drop', description: 'node-01 experienced a brief network partition', time: '45m ago', icon: <WifiOff size={14} />, colorClass: 'text-rose-500', bgClass: 'bg-rose-500/10' },
]

export function LiveWorkerActivity() {
  return <OperationsActivityFeed items={activityTimeline} maxHeight="400px" />
}
