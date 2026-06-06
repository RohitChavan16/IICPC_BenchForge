import { motion } from 'framer-motion'
import { CheckCircle2, Clock, ShieldAlert } from 'lucide-react'

export function WelcomeBanner({ userName = 'Admin', version = 'v1.0.4-prod' }: { userName?: string, version?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-violet-900 to-slate-900 p-8 shadow-lg shadow-indigo-950/20"
    >
      {/* Decorative shapes */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome back, {userName}
          </h1>
          <p className="mt-2 text-indigo-200">
            BenchForge Operations Center
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 border border-emerald-500/20 backdrop-blur-md">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-sm font-medium text-emerald-100">Platform Status: Healthy</span>
          </div>
          
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-4 py-2 border border-slate-700/50 backdrop-blur-md">
            <Clock size={18} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-200">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-4 py-2 border border-slate-700/50 backdrop-blur-md">
            <ShieldAlert size={18} className="text-indigo-400" />
            <span className="text-sm font-medium text-slate-200">Production</span>
            <span className="text-xs font-medium text-slate-400 ml-2">{version}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
