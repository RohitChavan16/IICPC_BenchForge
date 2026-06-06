import { motion } from 'framer-motion'
import { FileCode, Layers, Server, ShieldAlert, Activity, PlayCircle, BarChart3 } from 'lucide-react'

export function SubmissionOperationsHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl relative overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileCode className="text-indigo-400" size={32} />
            Submission Operations Center
          </h1>
          <p className="mt-2 text-slate-400 max-w-xl text-sm md:text-base">
            Monitor, inspect, troubleshoot and manage every submission across the platform.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-2">
          <div className="flex items-center gap-2 rounded-full bg-slate-800/80 border border-slate-700 px-3 py-1.5 backdrop-blur-sm">
            <Layers size={14} className="text-indigo-400" />
            <span className="text-xs font-medium text-slate-300">Total: <strong className="text-white">12,450</strong></span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 backdrop-blur-sm">
            <Activity size={14} className="text-cyan-400 animate-pulse" />
            <span className="text-xs font-medium text-cyan-100">Running: <strong className="text-cyan-400">42</strong></span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 backdrop-blur-sm">
            <Server size={14} className="text-amber-400" />
            <span className="text-xs font-medium text-amber-100">Queued: <strong className="text-amber-400">105</strong></span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 backdrop-blur-sm">
            <ShieldAlert size={14} className="text-rose-400" />
            <span className="text-xs font-medium text-rose-100">Failed: <strong className="text-rose-400">12</strong></span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap lg:flex-col xl:flex-row items-center gap-3 shrink-0">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 font-medium text-sm w-full sm:w-auto justify-center shadow-sm">
          <Server size={16} className="text-amber-400" />
          View Queue
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 font-medium text-sm w-full sm:w-auto justify-center shadow-sm">
          <PlayCircle size={16} className="text-cyan-400" />
          Open Pipeline
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors border border-indigo-500 font-medium text-sm w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]">
          <BarChart3 size={16} />
          Open Leaderboard
        </button>
      </div>
    </motion.div>
  )
}
