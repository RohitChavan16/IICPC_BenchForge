import { useWebsocket } from '@/hooks/useWebsocket'
import { WorkerUtilizationPanel } from './WorkerUtilizationPanel'
import { LivePersonaAnalytics } from './LivePersonaAnalytics'
import { LiveSampleStream } from './LiveSampleStream'
import { BottleneckDetectionPanel } from './BottleneckDetectionPanel'
import { TracerVisibilityPanel } from './TracerVisibilityPanel'

export function LiveBenchmarkCommandCenter() {
  const { workers, personas, tracerStats, requests, status } = useWebsocket()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Live Benchmark Command Center</h2>
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-muted-foreground capitalize">{status}</span>
        </div>
      </div>

      <WorkerUtilizationPanel workers={workers} />
      
      <LivePersonaAnalytics personas={personas} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveSampleStream requests={requests} />
        </div>
        <div className="flex flex-col gap-6">
          <BottleneckDetectionPanel personas={personas} />
          <TracerVisibilityPanel stats={tracerStats} />
        </div>
      </div>
    </div>
  )
}
