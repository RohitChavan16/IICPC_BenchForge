import { motion } from 'framer-motion'
import { Activity, Play, Zap, Settings, ArrowRight, Video } from 'lucide-react'

export function JudgeDemoPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="flex flex-col h-full rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
    >
      <div className="border-b border-slate-200 p-4 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Video size={18} className="text-rose-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Live Benchmark Spotlight</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Real-time execution visualization</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-transparent dark:border-slate-700">
            <Settings size={14} />
            Settings
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors text-xs font-medium border border-indigo-200/50 dark:border-indigo-500/20">
            View Details
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 bg-slate-50 dark:bg-slate-950/50">
        <div className="relative flex flex-col overflow-hidden rounded-2xl bg-slate-950 shadow-2xl h-full border border-slate-800">
          {/* Animated gradient border wrapper */}
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 opacity-20 animate-[pulse_3s_ease-in-out_infinite]" />
          <div className="absolute inset-[1px] z-0 rounded-2xl bg-slate-950" />
          
          {/* Decorative pulse glow */}
          <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
          <div className="absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col p-6 h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  <Zap size={20} className="animate-[pulse_1s_ease-in-out_infinite]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Live Submission</h2>
                  <p className="text-sm font-medium text-cyan-400">Judging Engine Active</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                <Play size={12} className="fill-current" />
                <span className="text-xs font-bold uppercase tracking-wider">Benchmarking</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center mb-8 flex-1">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Current TPS</p>
              <div className="relative">
                <motion.span 
                  className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-indigo-500 drop-shadow-lg"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  5,021
                </motion.span>
                <Activity className="absolute -right-8 top-2 text-cyan-400 animate-pulse" size={24} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 backdrop-blur-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Team</p>
                <p className="text-lg font-bold text-slate-200">Alpha</p>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 backdrop-blur-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Queue Position</p>
                <p className="text-lg font-bold text-amber-400">#1</p>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 backdrop-blur-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Latency</p>
                <p className="text-lg font-bold text-emerald-400">12ms</p>
              </div>
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 backdrop-blur-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Correctness</p>
                <p className="text-lg font-bold text-cyan-400">100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
