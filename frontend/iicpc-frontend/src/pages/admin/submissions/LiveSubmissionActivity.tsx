import { Activity, PlayCircle, FileCode, Trophy, AlertTriangle } from 'lucide-react'
import { OperationsActivityFeed } from '../../../components/admin/operations/OperationsActivityFeed'
import type { ActivityFeedItem } from '../../../components/admin/operations/OperationsActivityFeed'

const activityTimeline: ActivityFeedItem[] = [
  { id: 1, title: 'Leaderboard Updated', description: 'Team Alpha achieved Rank #1', time: 'Just now', icon: <Trophy size={14} />, colorClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
  { id: 2, title: 'Benchmark Running', description: 'Submission #1042 processing', time: '2m ago', icon: <Activity size={14} />, colorClass: 'text-cyan-500', bgClass: 'bg-cyan-500/10', isPulse: true },
  { id: 3, title: 'Build Started', description: 'Submission #1042 queued for build', time: '5m ago', icon: <PlayCircle size={14} />, colorClass: 'text-blue-500', bgClass: 'bg-blue-500/10' },
  { id: 4, title: 'New Submission', description: 'Team Beta submitted code', time: '5m ago', icon: <FileCode size={14} />, colorClass: 'text-indigo-500', bgClass: 'bg-indigo-500/10' },
  { id: 5, title: 'Tracer Failed', description: 'Worker node-04 anomaly detected', time: '12m ago', icon: <AlertTriangle size={14} />, colorClass: 'text-rose-500', bgClass: 'bg-rose-500/10' },
  { id: 6, title: 'New Submission', description: 'Team Gamma submitted code', time: '18m ago', icon: <FileCode size={14} />, colorClass: 'text-indigo-500', bgClass: 'bg-indigo-500/10' },
]

export function LiveSubmissionActivity() {
  return <OperationsActivityFeed items={activityTimeline} maxHeight="600px" />
}

