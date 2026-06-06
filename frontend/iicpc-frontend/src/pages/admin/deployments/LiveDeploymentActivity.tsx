import { Rocket, ShieldAlert, GitCommit, Package } from 'lucide-react'
import { OperationsActivityFeed } from '../../../components/admin/operations/OperationsActivityFeed'
import type { ActivityFeedItem } from '../../../components/admin/operations/OperationsActivityFeed'

const activityTimeline: ActivityFeedItem[] = [
  { id: 1, title: 'Container Started', description: 'DEP-8842 image pulled and container running', time: 'Just now', icon: <Rocket size={14} />, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10', isPulse: true },
  { id: 2, title: 'Image Build Complete', description: 'beta-sub-1043:v2 pushed to internal registry', time: '2m ago', icon: <Package size={14} />, colorClass: 'text-cyan-500', bgClass: 'bg-cyan-500/10' },
  { id: 3, title: 'Deployment Failed', description: 'DEP-8844 failed health check on startup', time: '1h ago', icon: <ShieldAlert size={14} />, colorClass: 'text-rose-500', bgClass: 'bg-rose-500/10' },
  { id: 4, title: 'Code Pulled', description: 'Submission code pulled from internal git storage', time: '1h 5m ago', icon: <GitCommit size={14} />, colorClass: 'text-indigo-500', bgClass: 'bg-indigo-500/10' },
]

export function LiveDeploymentActivity() {
  return <OperationsActivityFeed items={activityTimeline} maxHeight="400px" />
}
