import { Card } from '@/components/ui/Card'
import type { PersonaMetricMap } from '@/types/api'
import { AlertTriangle } from 'lucide-react'

interface BottleneckDetectionPanelProps {
  personas: PersonaMetricMap
}

const personaLabels: Record<string, string> = {
  retail: 'Retail Trader',
  market_maker: 'Market Maker',
  scalper: 'Scalper',
  whale: 'Whale',
  hft_stressor: 'HFT Stressor',
}

export function BottleneckDetectionPanel({ personas }: BottleneckDetectionPanelProps) {
  const entries = Object.entries(personas).filter(([k]) => k !== 'system_control')
  
  if (entries.length === 0) {
    return (
      <Card className="p-6 bg-card flex items-center justify-center text-muted-foreground h-full">
        Gathering bottleneck data...
      </Card>
    )
  }

  // Derive Worst Performing Persona (Highest P99 or Highest Failure Rate)
  const sortedByFailure = [...entries].sort((a, b) => b[1].failureRate - a[1].failureRate)
  const sortedByLatency = [...entries].sort((a, b) => b[1].p99 - a[1].p99)

  const highestError = sortedByFailure[0]
  const highestLatency = sortedByLatency[0]

  // Decide the absolute bottleneck
  let bottleneck = highestLatency
  let reason = 'Highest latency producer'
  
  if (highestError[1].failureRate > 5) {
    bottleneck = highestError
    reason = 'Highest error producer'
  }

  return (
    <Card className="p-6 bg-card border-rose-500/20">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-rose-500" />
        <h3 className="text-lg font-semibold text-card-foreground">Current Bottleneck</h3>
      </div>

      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold text-rose-500 mb-1">
            {personaLabels[bottleneck[0]] || bottleneck[0]}
          </div>
          <div className="text-sm text-rose-500/80 mb-2">
            Contribution: {reason}
          </div>
          <div className="flex gap-4 text-sm font-mono mt-2">
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground">P99</span>
              <span className="text-foreground">{Math.round(bottleneck[1].p99 / 1000000)}ms</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground">Errors</span>
              <span className="text-foreground">{Math.round(bottleneck[1].failureRate * 10) / 10}%</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
