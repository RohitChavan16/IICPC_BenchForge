import { motion } from 'framer-motion'
import { FileCode, PlayCircle, Clock, CheckCircle2, XCircle, Settings, ArrowRight, Filter } from 'lucide-react'

const submissions = [
  { id: '#1045', team: 'Team Gamma', status: 'Queued', score: '-', time: 'Just now' },
  { id: '#1044', team: 'Team Alpha', status: 'Running', score: '-', time: '1m ago' },
  { id: '#1043', team: 'Team Epsilon', status: 'Completed', score: '7950', time: '5m ago' },
  { id: '#1042', team: 'Team Beta', status: 'Completed', score: '9240', time: '12m ago' },
  { id: '#1041', team: 'Team Delta', status: 'Failed', score: '0', time: '18m ago' },
]

export function LatestSubmissions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="flex flex-col h-full rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
    >
      <div className="border-b border-slate-200 p-4 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <FileCode size={18} className="text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Latest Submissions</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Recent code execution requests</p>
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
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors text-xs font-medium border border-indigo-200/50 dark:border-indigo-500/20">
            View Details
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Submission</th>
              <th className="px-4 py-3 font-semibold">Team</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Score</th>
              <th className="px-4 py-3 font-semibold text-right">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {submissions.map((sub, idx) => {
              const isQueued = sub.status === 'Queued'
              const isRunning = sub.status === 'Running'
              const isCompleted = sub.status === 'Completed'
              const isFailed = sub.status === 'Failed'

              return (
                <motion.tr 
                  key={sub.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 + idx * 0.05 }}
                  className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{sub.id}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{sub.team}</td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                      isQueued ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700' :
                      isRunning ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 animate-pulse' :
                      isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' :
                      'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                    }`}>
                      {isQueued && <Clock size={12} />}
                      {isRunning && <PlayCircle size={12} />}
                      {isCompleted && <CheckCircle2 size={12} />}
                      {isFailed && <XCircle size={12} />}
                      {sub.status}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{sub.score}</td>
                  <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{sub.time}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
