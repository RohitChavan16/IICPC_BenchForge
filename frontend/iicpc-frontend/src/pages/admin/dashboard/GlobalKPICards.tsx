import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  FileCode,
  Rocket,
  Users,
  Settings,
  ArrowRight,
  RefreshCw
} from 'lucide-react'

const kpiData = [
  { id: 1, label: 'Total Teams', value: '1,248', trend: '+12%', trendType: 'positive', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { id: 2, label: 'Total Submissions', value: '45,892', trend: '+24%', trendType: 'positive', icon: FileCode, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 3, label: 'Active Benchmarks', value: '12', trend: 'Stable', trendType: 'neutral', icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { id: 4, label: 'Queue Depth', value: '0', trend: '-4%', trendType: 'positive', icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 5, label: 'Running Deployments', value: '8', trend: '+2', trendType: 'neutral', icon: Rocket, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { id: 6, label: 'Failed Deployments', value: '2', trend: '-1', trendType: 'positive', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 7, label: 'Average TPS', value: '4,521', trend: '+8%', trendType: 'positive', icon: Cpu, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  { id: 8, label: 'Average Correctness', value: '98.4%', trend: 'Stable', trendType: 'neutral', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
]

export function GlobalKPICards() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col rounded-xl border border-slate-200 bg-white/50 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div className="border-b border-slate-200 p-4 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Global KPI Cards</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">High-level metrics across the entire platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium">
            <Settings size={14} />
            Settings
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors text-xs font-medium">
            View Details
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.bg}`}>
                  <Icon size={20} className={kpi.color} />
                </div>
                <div className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  kpi.trendType === 'positive' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                    : kpi.trendType === 'negative'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {kpi.trend}
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.label}</h3>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.value}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
