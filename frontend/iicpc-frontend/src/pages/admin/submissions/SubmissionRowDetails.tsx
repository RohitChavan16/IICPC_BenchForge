import { motion } from 'framer-motion'
import { Activity, Database, Server, CheckCircle2, XCircle, AlertTriangle, PlayCircle, BarChart3, Clock } from 'lucide-react'

interface SubmissionRowDetailsProps {
  submissionId: string
  status: string
}

export function SubmissionRowDetails({ submissionId, status }: SubmissionRowDetailsProps) {
  const isFailed = status === 'Failed'
  const isRunning = status === 'Running'

  // Use submissionId to satisfy TS and provide detail
  const displayId = submissionId

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-slate-50 dark:bg-slate-950/50 p-6 border-b border-slate-200 dark:border-slate-800"
    >
      <div className="text-[10px] text-slate-400 mb-2 font-mono">Tracing ID: {displayId}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Pipeline Stages */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pipeline Status</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Build</span>
              </div>
              <span className="text-xs text-slate-500">45s</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Deployment</span>
              </div>
              <span className="text-xs text-slate-500">12s</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2">
                {isFailed ? <XCircle size={16} className="text-rose-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
                <span className="font-medium text-slate-700 dark:text-slate-300">Validation</span>
              </div>
              <span className="text-xs text-slate-500">{isFailed ? 'Failed' : '2s'}</span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm opacity-50">
              <div className="flex items-center gap-2">
                {isRunning ? <PlayCircle size={16} className="text-blue-500 animate-pulse" /> : <Clock size={16} className="text-slate-400" />}
                <span className="font-medium text-slate-700 dark:text-slate-300">Benchmark</span>
              </div>
              <span className="text-xs text-slate-500">{isRunning ? 'Running...' : 'Pending'}</span>
            </div>
          </div>
        </div>

        {/* Center Column: Resource Usage & Telemetry */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Worker Telemetry</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <Server size={14} className="text-indigo-500" />
                <span className="text-[10px] font-semibold uppercase text-slate-500">Memory</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">1.2<span className="text-xs text-slate-500 font-medium ml-1">GB</span></p>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity size={14} className="text-cyan-500" />
                <span className="text-[10px] font-semibold uppercase text-slate-500">CPU</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">85<span className="text-xs text-slate-500 font-medium ml-1">%</span></p>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <Database size={14} className="text-emerald-500" />
                <span className="text-[10px] font-semibold uppercase text-slate-500">Redis Ops</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">4k<span className="text-xs text-slate-500 font-medium ml-1">/s</span></p>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={14} className={isFailed ? 'text-rose-500' : 'text-amber-500'} />
                <span className="text-[10px] font-semibold uppercase text-slate-500">Errors</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{isFailed ? '14' : '0'}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Mini Charts */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Live Charts</h4>
          
          <div className="flex-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm p-4 flex flex-col justify-center">
            {isFailed ? (
              <div className="flex flex-col items-center justify-center text-center text-rose-500">
                <XCircle size={24} className="mb-2" />
                <p className="text-sm font-medium">Validation failed before benchmarking</p>
                <button className="mt-2 text-xs underline">View Error Logs</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-slate-500">TPS Profile</span>
                  <BarChart3 size={14} className="text-indigo-400" />
                </div>
                <div className="h-16 flex items-end gap-1 w-full">
                  {/* Fake sparkline chart */}
                  {[20, 35, 45, 60, 80, 85, 82, 88, 90, 85, 80, 75, 60, 45, 30].map((val, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${val}%` }}
                      transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                      className="flex-1 bg-indigo-500/80 rounded-t-sm"
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  )
}
