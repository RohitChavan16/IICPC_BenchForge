import { motion } from 'framer-motion'
import { CheckCircle2, FileCode, Trophy, XCircle, AlertTriangle, Zap, Settings, ArrowRight, Filter } from 'lucide-react'

const activityFeed = [
  { id: 1, type: 'leaderboard', title: 'Leaderboard updated', desc: 'Team Alpha moved to Rank #1', time: 'Just now', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 2, type: 'benchmark', title: 'Benchmark completed', desc: 'Submission #1042 processed successfully', time: '2m ago', icon: Zap, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { id: 3, type: 'validation', title: 'Validation failed', desc: 'Team Beta submission #1041 failed validation', time: '5m ago', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 4, type: 'build', title: 'Build completed', desc: 'Submission #1041 built successfully', time: '8m ago', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 5, type: 'submission', title: 'New submission', desc: 'Team Beta submitted code', time: '12m ago', icon: FileCode, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { id: 6, type: 'tracer', title: 'Tracer failure detected', desc: 'Worker node node-04 reported tracer anomaly', time: '15m ago', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 7, type: 'submission', title: 'New submission', desc: 'Team Alpha submitted code', time: '20m ago', icon: FileCode, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
]

export function LiveActivityFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex flex-col h-full rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="border-b border-slate-200 p-4 dark:border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Live Activity Feed
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time platform events</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-transparent dark:border-slate-700">
            <Filter size={14} />
            Filter
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-transparent dark:border-slate-700">
            <Settings size={14} />
            Settings
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors text-xs font-medium border border-indigo-200/50 dark:border-indigo-500/20 ml-auto">
            View All
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-[400px] overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-6 pb-4">
          {activityFeed.map((activity, idx) => {
            const Icon = activity.icon
            return (
              <motion.div 
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + idx * 0.05 }}
                className="relative pl-6"
              >
                <div className={`absolute -left-[17px] flex h-8 w-8 items-center justify-center rounded-full border-4 border-white dark:border-slate-900 ${activity.bg} ${activity.color}`}>
                  <Icon size={14} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{activity.title}</h3>
                  <span className="text-xs font-medium text-slate-400">{activity.time}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{activity.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
