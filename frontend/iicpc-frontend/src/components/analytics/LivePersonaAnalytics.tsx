import { Card } from '@/components/ui/Card'
import type { PersonaMetricMap } from '@/types/api'
import { motion } from 'framer-motion'

interface LivePersonaAnalyticsProps {
  personas: PersonaMetricMap
}

const personaColors: Record<string, string> = {
  retail: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  market_maker: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  scalper: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  whale: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  hft_stressor: 'bg-rose-500/20 text-rose-500 border-rose-500/30',
}

const personaLabels: Record<string, string> = {
  retail: 'Retail Trader',
  market_maker: 'Market Maker',
  scalper: 'Scalper',
  whale: 'Whale',
  hft_stressor: 'HFT Stressor',
}

export function LivePersonaAnalytics({ personas }: LivePersonaAnalyticsProps) {
  const personaList = Object.entries(personas).filter(([k]) => k !== 'system_control')
  const totalRequests = personaList.reduce((acc, [_, p]) => acc + p.total, 0)

  return (
    <Card className="p-6 bg-card">
      <h3 className="text-lg font-semibold mb-4 text-card-foreground">Live Persona Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {personaList.map(([botType, metric]) => {
          const colorClass = personaColors[botType] || 'bg-secondary text-foreground border-border'
          const label = personaLabels[botType] || botType
          const dist = totalRequests > 0 ? Math.round((metric.total / totalRequests) * 100) : 0

          return (
            <motion.div
              key={botType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${colorClass} flex flex-col gap-2`}
            >
              <div className="font-bold mb-2">{label}</div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-80">Distribution</span>
                <span className="font-mono font-medium">{dist}%</span>
              </div>
              
              <div className="w-full bg-background/50 rounded-full h-1.5 mb-1 overflow-hidden">
                <motion.div 
                  className="h-full bg-current opacity-80" 
                  initial={{ width: 0 }}
                  animate={{ width: `${dist}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="opacity-80">Requests</span>
                <span className="font-mono font-medium">{metric.total}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-80">TPS</span>
                <span className="font-mono font-medium">{Math.round(metric.tps)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="opacity-80">P99 Latency</span>
                <span className="font-mono font-medium">{Math.round(metric.p99 / 1000000)}ms</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="opacity-80">Success Rate</span>
                <span className="font-mono font-medium">{Math.round((100 - metric.failureRate) * 10) / 10}%</span>
              </div>
            </motion.div>
          )
        })}
        {personaList.length === 0 && (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            Awaiting persona telemetry...
          </div>
        )}
      </div>
    </Card>
  )
}
