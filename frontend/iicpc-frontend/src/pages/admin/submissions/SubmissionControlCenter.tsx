import { motion } from 'framer-motion'
import { Server, HelpCircle, ArrowRight } from 'lucide-react'
import { SubmissionFilters } from './SubmissionFilters'
import { SubmissionTable } from './SubmissionTable'

export function SubmissionControlCenter() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="flex flex-col flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
    >
      <div className="border-b border-slate-200 p-4 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server size={18} className="text-indigo-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Submission Control Center
            <div className="group relative">
              <HelpCircle size={14} className="text-slate-400 hover:text-indigo-400 cursor-help transition-colors" />
              <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-slate-800 text-xs text-slate-200 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                Displays every submission currently known by the platform. Click on a row to expand its operational details and telemetry.
              </div>
            </div>
          </h2>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors text-xs font-medium border border-indigo-200/50 dark:border-indigo-500/20">
          View All Active
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="p-4 md:p-6 flex flex-col flex-1">
        <SubmissionFilters />
        
        {/* Table Container with scrolling if needed, but flex-1 to stretch */}
        <div className="flex-1 w-full relative">
          <SubmissionTable />
        </div>
      </div>
    </motion.div>
  )
}
