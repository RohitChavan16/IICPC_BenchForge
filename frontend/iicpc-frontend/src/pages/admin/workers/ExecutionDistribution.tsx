import { WorkerMetricsChart } from '../../../components/workers/WorkerMetricsChart'
import { motion } from 'framer-motion'
import type { WorkerMetricSnapshot, WorkerStatus } from '../../../types/api'
import { BarChart3, Info } from 'lucide-react'

interface ExecutionDistributionProps {
  workers: WorkerStatus[]
  selectedWorkerId: string | null
  history: WorkerMetricSnapshot[]
}

export function ExecutionDistribution({ workers, selectedWorkerId, history }: ExecutionDistributionProps) {
  // Calculate relative load (mock logic)
  const totalTps = workers.reduce((acc, w) => acc + w.tps, 0) || 1

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
      <div className="xl:col-span-1 h-full flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <BarChart3 size={16} className="text-blue-500" />
          Load Distribution
        </h3>
        <div className="flex-1 space-y-4">
          {workers.map((w, idx) => {
            const percentage = Math.round((w.tps / totalTps) * 100)
            return (
              <div key={w.workerId}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">{w.workerId}</span>
                  <span className="text-xs text-slate-500">{percentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                    className={`h-full ${selectedWorkerId === w.workerId ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="xl:col-span-2 h-full flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Selected Worker Telemetry
          </h3>
          {selectedWorkerId && (
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
              {selectedWorkerId}
            </span>
          )}
        </div>
        
        <div className="flex-1 min-h-[300px]">
          {selectedWorkerId && history.length > 0 ? (
            <WorkerMetricsChart workerId={selectedWorkerId} data={history} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <Info size={24} className="mb-2 opacity-50" />
              <p className="text-sm">Select a worker from the matrix to view live telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
