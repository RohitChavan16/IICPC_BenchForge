import { motion } from 'framer-motion'
import { Server, ArrowRight, Play, CheckCircle2 } from 'lucide-react'

const flowStages = [
  { id: 'ingestion', name: 'Ingestion', value: 120, capacity: 500, color: 'bg-indigo-500' },
  { id: 'validation', name: 'Validation', value: 105, capacity: 200, color: 'bg-blue-500' },
  { id: 'build', name: 'Build Queue', value: 42, capacity: 50, color: 'bg-amber-500', warning: true },
  { id: 'benchmark', name: 'Benchmark Queue', value: 15, capacity: 100, color: 'bg-cyan-500' },
  { id: 'scoring', name: 'Scoring', value: 5, capacity: 500, color: 'bg-emerald-500' },
]

export function QueueFlowVisualization() {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm h-full p-6">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
        <Play size={16} className="text-cyan-500" />
        Queue Flow Visualization
      </h3>
      
      <div className="flex-1 flex flex-col justify-center space-y-6">
        {flowStages.map((stage, idx) => {
          const loadPercentage = Math.min(100, (stage.value / stage.capacity) * 100)
          
          return (
            <div key={stage.id} className="relative">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{stage.name}</span>
                <span className="text-xs font-mono text-slate-500">
                  <strong className={stage.warning ? 'text-amber-500' : 'text-slate-900 dark:text-slate-100'}>{stage.value}</strong> / {stage.capacity}
                </span>
              </div>
              
              <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${loadPercentage}%` }}
                  transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                  className={`h-full ${stage.color} ${stage.warning ? 'animate-pulse' : ''}`}
                />
              </div>
              
              {idx < flowStages.length - 1 && (
                <div className="absolute -bottom-5 left-8 text-slate-300 dark:text-slate-700">
                  <ArrowRight size={14} className="rotate-90" />
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
        <span className="flex items-center gap-1"><Server size={12} /> Auto-scaling enabled</span>
        <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 size={12} /> Flow Stable</span>
      </div>
    </div>
  )
}
