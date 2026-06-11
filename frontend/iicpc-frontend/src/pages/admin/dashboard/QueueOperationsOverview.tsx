import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Layers, PlayCircle, Settings, ArrowRight, RefreshCw, Clock, AlertTriangle, Rocket, ListFilter } from 'lucide-react'
import { listSubmissions } from '@/services/api/submissionService'
export function QueueOperationsOverview() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAll = () => {
    setIsLoading(true)
    listSubmissions()
      .then(setSubmissions)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 10000)
    return () => clearInterval(interval)
  }, [])

  const runningJobs = useMemo(() => submissions.filter(s => !['completed', 'failed', 'cancelled'].includes(s.status?.toLowerCase())).length, [submissions])
  const queuedJobs = useMemo(() => submissions.filter(s => s.status?.toLowerCase() === 'pending' || s.currentStage === 'UPLOAD').length, [submissions])
  const failedJobs = useMemo(() => submissions.filter(s => s.status?.toLowerCase() === 'failed').length, [submissions])
  const activeDeployments = useMemo(() => submissions.filter(s => s.currentStage === 'DEPLOYMENT').length, [submissions])

  const avgWaitTime = useMemo(() => {
    const started = submissions.filter(s => s.startedAt && s.createdAt)
    if (started.length === 0) return 0
    const totalWait = started.reduce((acc, s) => acc + (new Date(s.startedAt).getTime() - new Date(s.createdAt).getTime()), 0)
    return (totalWait / started.length / 1000).toFixed(1)
  }, [submissions])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="flex flex-col rounded-xl border border-cyan-200/50 bg-gradient-to-br from-cyan-50/50 to-white shadow-sm dark:border-cyan-900/30 dark:from-slate-900 dark:to-slate-900 overflow-hidden relative h-full"
    >
      {/* Subtle Cyan background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="border-b border-cyan-100/50 p-4 dark:border-cyan-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <ListFilter size={18} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Queue Operations</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage and monitor job execution queues</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-transparent dark:border-slate-700 disabled:opacity-50">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-transparent dark:border-slate-700">
            <Settings size={14} />
            Settings
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-400 dark:hover:bg-cyan-500/20 transition-colors text-xs font-medium border border-cyan-200/50 dark:border-cyan-500/20">
            View Details
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
      
      <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-6 z-10 flex-1">
        
        {/* Metric 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
            <PlayCircle size={16} />
            <h3 className="text-sm font-medium">Running Jobs</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-3xl font-bold text-slate-900 dark:text-slate-100"
            >{runningJobs}</motion.span>
            <span className="text-xs font-medium text-slate-500">/ 16 cap</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <motion.div 
              initial={{ width: 0 }} animate={{ width: `${Math.min((runningJobs / 16) * 100, 100)}%` }} transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-cyan-500 dark:bg-cyan-400 rounded-full" 
            />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <Layers size={16} />
            <h3 className="text-sm font-medium">Queued Jobs</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-3xl font-bold text-slate-900 dark:text-slate-100"
            >{queuedJobs}</motion.span>
            <span className="text-xs font-medium text-slate-500">pending</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex gap-0.5">
            {[...Array(Math.min(queuedJobs, 20))].map((_, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.5 + i * 0.1 }} className="h-full flex-1 bg-indigo-400 dark:bg-indigo-500 rounded-sm" />
            ))}
            {[...Array(Math.max(0, 20 - queuedJobs))].map((_, i) => (
              <div key={`empty-${i}`} className="h-full flex-1 bg-transparent" />
            ))}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Clock size={16} />
            <h3 className="text-sm font-medium">Avg Wait Time</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-3xl font-bold text-slate-900 dark:text-slate-100"
            >{avgWaitTime}</motion.span>
            <span className="text-xs font-medium text-slate-500">seconds</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <motion.div 
              initial={{ width: 0 }} animate={{ width: `${Math.min(Number(avgWaitTime) * 10, 100)}%` }} transition={{ duration: 1, delay: 0.6 }}
              className="h-full bg-amber-500 dark:bg-amber-400 rounded-full" 
            />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Cpu size={16} />
            <h3 className="text-sm font-medium">Worker Util</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-3xl font-bold text-slate-900 dark:text-slate-100"
            >80</motion.span>
            <span className="text-xs font-medium text-slate-500">%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <motion.div 
              initial={{ width: 0 }} animate={{ width: '80%' }} transition={{ duration: 1, delay: 0.7 }}
              className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full" 
            />
          </div>
        </div>

        {/* Metric 5 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <AlertTriangle size={16} />
            <h3 className="text-sm font-medium">Failed Jobs</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-3xl font-bold text-slate-900 dark:text-slate-100"
            >{failedJobs}</motion.span>
            <span className="text-xs font-medium text-slate-500">total failures</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <motion.div 
              initial={{ width: 0 }} animate={{ width: `${Math.min(failedJobs * 5, 100)}%` }} transition={{ duration: 1, delay: 0.8 }}
              className="h-full bg-rose-500 dark:bg-rose-400 rounded-full" 
            />
          </div>
        </div>

        {/* Metric 6 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
            <Rocket size={16} />
            <h3 className="text-sm font-medium">Active Deployments</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <motion.span 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-3xl font-bold text-slate-900 dark:text-slate-100"
            >{activeDeployments}</motion.span>
            <span className="text-xs font-medium text-slate-500">rolling</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 flex gap-0.5">
            {[...Array(Math.min(activeDeployments, 10))].map((_, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.9 + i * 0.1 }} className="h-full flex-1 bg-violet-400 dark:bg-violet-500 rounded-sm animate-pulse" />
            ))}
            {[...Array(Math.max(0, 10 - activeDeployments))].map((_, i) => (
              <div key={`empty-${i}`} className="h-full flex-1 bg-transparent" />
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  )
}
