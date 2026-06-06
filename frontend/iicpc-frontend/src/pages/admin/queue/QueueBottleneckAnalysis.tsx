import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Search } from 'lucide-react'

export function QueueBottleneckAnalysis() {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm h-full p-6">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
        <Search size={16} className="text-amber-500" />
        Bottleneck Analysis
      </h3>
      
      <div className="flex-1 space-y-4">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
        >
          <div className="flex gap-3">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">Build Stage Saturation</h4>
              <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1 leading-relaxed">
                Build queue is operating at 84% capacity. Average wait time in this stage has increased by 1.4s in the last 10 minutes.
              </p>
              <button className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline">
                Provision additional build workers &rarr;
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex gap-3">
            <TrendingUp size={18} className="text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Benchmark Throughput Stable</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Worker nodes are processing benchmark payloads optimally. P99 latency is maintaining strict SLA requirements.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Global Cluster Load</span>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">62%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '62%' }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-cyan-500"
          />
        </div>
      </div>
    </div>
  )
}
