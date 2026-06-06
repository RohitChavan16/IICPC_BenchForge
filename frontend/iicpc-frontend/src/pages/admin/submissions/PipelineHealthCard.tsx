import { motion } from 'framer-motion'
import { CheckCircle2, Activity, HelpCircle, ArrowRight } from 'lucide-react'

const pipelineStages = [
  { id: 'submission', name: 'Submission', count: '12,450', rate: '100%', duration: '0.1s', status: 'healthy', color: 'text-indigo-500', bg: 'bg-indigo-500' },
  { id: 'build', name: 'Build', count: '12,400', rate: '99.6%', duration: '45s', status: 'healthy', color: 'text-blue-500', bg: 'bg-blue-500' },
  { id: 'deploy', name: 'Deploy', count: '12,380', rate: '99.8%', duration: '12s', status: 'healthy', color: 'text-cyan-500', bg: 'bg-cyan-500' },
  { id: 'validation', name: 'Validation', count: '12,200', rate: '98.5%', duration: '2s', status: 'warning', color: 'text-amber-500', bg: 'bg-amber-500' },
  { id: 'correctness', name: 'Correctness', count: '11,900', rate: '97.5%', duration: '15s', status: 'healthy', color: 'text-emerald-500', bg: 'bg-emerald-500' },
  { id: 'benchmark', name: 'Benchmark', count: '11,802', rate: '99.1%', duration: '300s', status: 'healthy', color: 'text-violet-500', bg: 'bg-violet-500' },
  { id: 'leaderboard', name: 'Leaderboard', count: '11,802', rate: '100%', duration: '0.5s', status: 'healthy', color: 'text-rose-500', bg: 'bg-rose-500' },
]

export function PipelineHealthCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden h-full"
    >
      <div className="border-b border-slate-200 p-4 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={18} className="text-cyan-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Pipeline Health
            <div className="group relative">
              <HelpCircle size={14} className="text-slate-400 hover:text-indigo-400 cursor-help transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-slate-800 text-xs text-slate-200 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                Shows performance of every stage in the evaluation pipeline.
              </div>
            </div>
          </h2>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-transparent dark:border-slate-700">
          View Details
          <ArrowRight size={14} />
        </button>
      </div>
      
      <div className="p-5 flex-1 overflow-x-auto">
        <div className="flex items-stretch justify-between min-w-[800px] h-full gap-2">
          {pipelineStages.map((stage, idx) => (
            <div key={stage.id} className="flex-1 flex flex-col relative group">
              {/* Connection Line */}
              {idx < pipelineStages.length - 1 && (
                <div className="absolute top-6 left-1/2 w-full h-0.5 bg-slate-200 dark:bg-slate-800 z-0">
                  <div className={`h-full ${stage.bg} opacity-50 w-full`} />
                </div>
              )}
              
              <div className="relative z-10 flex flex-col items-center">
                {/* Node */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md ${stage.status === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                  {stage.status === 'healthy' ? <CheckCircle2 size={20} className={stage.color} /> : <Activity size={20} className="animate-pulse" />}
                </div>
                
                {/* Details */}
                <div className="mt-4 text-center">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">{stage.name}</h3>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-2 border border-slate-100 dark:border-slate-800 shadow-sm w-24">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-500">Vol:</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{stage.count}</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-500">Rate:</span>
                      <span className={`text-xs font-semibold ${stage.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'}`}>{stage.rate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500">Avg:</span>
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{stage.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
