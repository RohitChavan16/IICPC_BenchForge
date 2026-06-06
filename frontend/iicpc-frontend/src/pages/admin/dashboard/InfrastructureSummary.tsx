import { motion } from 'framer-motion'
import { Activity, Database, Server, Layers, Settings, ArrowRight, DownloadCloud } from 'lucide-react'

// Hardcoded chart data (0-100 normalized)
const chartData = {
  tps: [20, 35, 45, 30, 50, 75, 60, 85, 70, 95, 80, 65, 85, 90, 75],
  queue: [10, 15, 20, 15, 25, 40, 35, 50, 45, 60, 50, 40, 30, 20, 10],
  redis: [40, 42, 45, 48, 50, 52, 55, 53, 50, 48, 52, 55, 58, 60, 62],
  postgres: [20, 25, 22, 28, 30, 35, 32, 28, 25, 22, 28, 35, 40, 38, 35]
}

const infraMetrics = [
  { id: 'tps', label: 'Current TPS', value: '8,452', unit: 'req/s', icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-500', data: chartData.tps },
  { id: 'queue', label: 'Queue Depth', value: '142', unit: 'jobs', icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-500', data: chartData.queue },
  { id: 'redis', label: 'Redis Memory', value: '4.2', unit: 'GB', icon: Server, color: 'text-rose-500', bg: 'bg-rose-500', data: chartData.redis },
  { id: 'postgres', label: 'Postgres Connections', value: '240', unit: '/ 500', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-500', data: chartData.postgres },
]

export function InfrastructureSummary() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="flex flex-col h-full rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
    >
      <div className="border-b border-slate-200 p-4 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Server size={18} className="text-emerald-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Infrastructure Monitoring</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live resource utilization and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-transparent dark:border-slate-700">
            <DownloadCloud size={14} />
            Export Data
          </button>
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
      
      <div className="p-5 flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {infraMetrics.map((metric, idx) => {
          const Icon = metric.icon
          return (
            <motion.div 
              key={metric.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + idx * 0.05 }}
              className="group flex flex-col p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon size={16} className={metric.color} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{metric.label}</h3>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{metric.value}</span>
                  <span className="text-xs font-medium text-slate-500">{metric.unit}</span>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="mt-auto h-16 flex items-end gap-1">
                {metric.data.map((val, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${val}%` }}
                    transition={{ duration: 0.5, delay: 0.5 + (i * 0.02) }}
                    className={`flex-1 rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity ${metric.bg}`}
                  />
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
