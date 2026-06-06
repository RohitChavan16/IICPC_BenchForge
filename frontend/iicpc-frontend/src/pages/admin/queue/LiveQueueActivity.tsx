import { PlayCircle, ShieldAlert, GitMerge, FileCode } from 'lucide-react'
import { OperationsActivityFeed } from '../../../components/admin/operations/OperationsActivityFeed'
import type { ActivityFeedItem } from '../../../components/admin/operations/OperationsActivityFeed'

const activityTimeline: ActivityFeedItem[] = [
  { id: 1, title: 'Job Failed', description: 'JOB-9924 moved to DLQ after 3 retries', time: 'Just now', icon: <ShieldAlert size={14} />, colorClass: 'text-rose-500', bgClass: 'bg-rose-500/10', isPulse: true },
  { id: 2, title: 'Processing Started', description: 'JOB-9921 assigned to node-02', time: '2m ago', icon: <PlayCircle size={14} />, colorClass: 'text-cyan-500', bgClass: 'bg-cyan-500/10' },
  { id: 3, title: 'Queue Rebalanced', description: 'Auto-scaler provisioned 2 new build workers', time: '5m ago', icon: <GitMerge size={14} />, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
  { id: 4, title: 'Batch Ingestion', description: '42 new submissions queued from Team Beta', time: '12m ago', icon: <FileCode size={14} />, colorClass: 'text-indigo-500', bgClass: 'bg-indigo-500/10' },
]

export function LiveQueueActivity() {
  return <OperationsActivityFeed items={activityTimeline} maxHeight="400px" />
}
