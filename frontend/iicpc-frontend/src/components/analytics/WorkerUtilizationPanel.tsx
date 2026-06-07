import { Card } from '@/components/ui/Card'
import type { WorkerMetricMap } from '@/types/api'
import { Activity, Server, Zap, Hash } from 'lucide-react'
import { motion } from 'framer-motion'

interface WorkerUtilizationPanelProps {
  workers: WorkerMetricMap
}

export function WorkerUtilizationPanel({ workers }: WorkerUtilizationPanelProps) {
  const workerList = Object.values(workers)
  const total = workerList.length
  // Consider a worker busy if it has processed any requests recently (tps > 0)
  const busy = workerList.filter(w => w.tps > 0).length
  const idle = total - busy
  // Peak can be tracked over time, but for this simple panel we just use total
  const peak = total

  return (
    <Card className="p-6 bg-card">
      <h3 className="text-lg font-semibold mb-4 text-card-foreground">Worker Utilization</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Server className="w-4 h-4" />
            <span className="text-sm font-medium">Total</span>
          </div>
          <motion.div
            key={total}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-foreground"
          >
            {total}
          </motion.div>
        </div>

        <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Busy</span>
          </div>
          <motion.div
            key={busy}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-primary"
          >
            {busy}
          </motion.div>
        </div>

        <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Hash className="w-4 h-4" />
            <span className="text-sm font-medium">Idle</span>
          </div>
          <motion.div
            key={idle}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-muted-foreground"
          >
            {idle}
          </motion.div>
        </div>

        <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
          <div className="flex items-center gap-2 mb-2 text-amber-500">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Peak</span>
          </div>
          <motion.div
            key={peak}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-amber-500"
          >
            {peak}
          </motion.div>
        </div>

      </div>
    </Card>
  )
}
