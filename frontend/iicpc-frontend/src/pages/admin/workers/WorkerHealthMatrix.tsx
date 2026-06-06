import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import type { WorkerStatus } from '../../../types/api'

interface WorkerHealthMatrixProps {
  workers: WorkerStatus[]
  selectedWorkerId: string | null
  onSelectWorker: (id: string) => void
}

export function WorkerHealthMatrix({ workers, selectedWorkerId, onSelectWorker }: WorkerHealthMatrixProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {workers.map((worker, idx) => {
        const isActive = worker.status === 'Active'
        const isIdle = worker.status === 'Idle'
        const isSelected = selectedWorkerId === worker.workerId
        
        // Mock identification of benchmark workers (e.g., node-02, node-03)
        const isBenchmarkWorker = worker.workerId.includes('-02') || worker.workerId.includes('-03')

        return (
          <motion.button
            key={worker.workerId}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            onClick={() => onSelectWorker(worker.workerId)}
            className={`relative p-4 rounded-xl text-left border transition-all overflow-hidden group
              ${isSelected 
                ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.15)] ring-1 ring-blue-400' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/50 shadow-sm hover:shadow-md'
              }
            `}
          >
            {isBenchmarkWorker && (
              <div className="absolute top-0 right-0 px-2 py-1 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider rounded-bl-lg flex items-center gap-1 z-10">
                <Zap size={10} /> Benchmark
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{worker.workerId}</h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`relative flex h-2 w-2 ${isActive ? '' : 'opacity-50'}`}>
                    {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-emerald-500' : isIdle ? 'bg-slate-400' : 'bg-rose-500'}`}></span>
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{worker.status}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded flex flex-col">
                <span className="text-slate-400 mb-0.5">TPS</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{worker.tps.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded flex flex-col">
                <span className="text-slate-400 mb-0.5">P90 Latency</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{worker.p90}ms</span>
              </div>
            </div>

            {/* Hover overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 to-blue-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        )
      })}
    </div>
  )
}
