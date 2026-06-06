import { motion } from 'framer-motion'
import { Play, PauseCircle, Trash2, FileText, Settings } from 'lucide-react'

export function QuickActionsBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <div className="flex items-center gap-2 mr-4 border-r border-slate-200 dark:border-slate-700 pr-6">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Quick Actions</h2>
      </div>
      
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200/50 dark:border-indigo-500/20 font-medium text-sm">
        <Play size={16} />
        Deploy Workers
      </button>
      
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20 transition-colors border border-amber-200/50 dark:border-amber-500/20 font-medium text-sm">
        <PauseCircle size={16} />
        Pause Submissions
      </button>
      
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-colors border border-rose-200/50 dark:border-rose-500/20 font-medium text-sm">
        <Trash2 size={16} />
        Clear Queue
      </button>
      
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-200/50 dark:border-emerald-500/20 font-medium text-sm">
        <FileText size={16} />
        Generate Report
      </button>

      <button className="ml-auto flex items-center justify-center p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700">
        <Settings size={18} />
      </button>
    </motion.div>
  )
}
