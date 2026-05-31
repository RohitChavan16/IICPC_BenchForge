import { Card } from '@/components/ui/Card'
import { Box, Server, UploadCloud, Zap, CheckCircle, AlertCircle } from 'lucide-react'

// Mock data for the activity feed
const activities = [
  { id: 1, time: 'Just now', type: 'benchmark', text: 'Benchmark completed for "Rust-HFT-v2"', icon: CheckCircle, color: 'text-emerald-400' },
  { id: 2, time: '2m ago', type: 'telemetry', text: 'Peak TPS of 18,402 recorded', icon: Zap, color: 'text-cyan-400' },
  { id: 3, time: '5m ago', type: 'deploy', text: 'Deployed 100 worker nodes in us-east', icon: Server, color: 'text-violet-400' },
  { id: 4, time: '8m ago', type: 'build', text: 'Container build successful', icon: Box, color: 'text-emerald-400' },
  { id: 5, time: '10m ago', type: 'upload', text: 'Submission "Rust-HFT-v2" uploaded', icon: UploadCloud, color: 'text-slate-400' },
  { id: 6, time: '1h ago', type: 'error', text: 'Node crash detected, auto-recovering', icon: AlertCircle, color: 'text-rose-400' },
]

export function ActivityFeed() {
  return (
    <Card title="Activity Feed" description="Real-time events from the benchmark engine.">
      <div className="mt-6 space-y-6">
        {activities.map((activity, idx) => (
          <div key={activity.id} className="relative flex gap-4">
            {/* Timeline connector line */}
            {idx !== activities.length - 1 && (
              <div className="absolute left-[19px] top-[32px] bottom-[-24px] w-px bg-white/10" />
            )}
            
            <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-900/80 ${activity.color}`}>
              <activity.icon size={16} />
            </div>
            
            <div className="flex flex-col pt-2">
              <p className="text-sm font-medium text-white">{activity.text}</p>
              <p className="mt-1 text-xs text-slate-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
