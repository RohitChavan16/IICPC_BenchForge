import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, PlayCircle, FileText, BarChart2, Activity, Trash2, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { SubmissionRowDetails } from './SubmissionRowDetails'

// Mock Data
const submissionsData = [
  { id: '#SUB-1045', team: 'Team Alpha', lang: 'Rust', status: 'Running', tps: '5,021', p99: '12ms', correctness: '100%', concurrency: '100', score: '-', time: '2m ago' },
  { id: '#SUB-1044', team: 'Team Beta', lang: 'Go', status: 'Queued', tps: '-', p99: '-', correctness: '-', concurrency: '-', score: '-', time: '5m ago' },
  { id: '#SUB-1043', team: 'Team Gamma', lang: 'Python', status: 'Completed', tps: '4,120', p99: '45ms', correctness: '95%', concurrency: '100', score: '8,750', time: '15m ago' },
  { id: '#SUB-1042', team: 'Team Delta', lang: 'Node.js', status: 'Completed', tps: '3,950', p99: '55ms', correctness: '94%', concurrency: '100', score: '8,100', time: '1h ago' },
  { id: '#SUB-1041', team: 'Team Epsilon', lang: 'Java', status: 'Failed', tps: '-', p99: '-', correctness: '-', concurrency: '-', score: '0', time: '2h ago' },
  { id: '#SUB-1040', team: 'Team Zeta', lang: 'C++', status: 'Completed', tps: '4,890', p99: '15ms', correctness: '98%', concurrency: '100', score: '9,240', time: '3h ago' },
]

export function SubmissionTable() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 w-8"></th>
            <th className="px-4 py-3 font-semibold">ID</th>
            <th className="px-4 py-3 font-semibold">Team</th>
            <th className="px-4 py-3 font-semibold">Lang</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold text-right">TPS</th>
            <th className="px-4 py-3 font-semibold text-right">P99</th>
            <th className="px-4 py-3 font-semibold text-right">Correctness</th>
            <th className="px-4 py-3 font-semibold text-right">Conc.</th>
            <th className="px-4 py-3 font-semibold text-right">Score</th>
            <th className="px-4 py-3 font-semibold text-right">Time</th>
            <th className="px-4 py-3 font-semibold text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {submissionsData.map((sub, idx) => {
            const isExpanded = expandedRows.has(sub.id)
            const isQueued = sub.status === 'Queued'
            const isRunning = sub.status === 'Running'
            const isCompleted = sub.status === 'Completed'
            const isFailed = sub.status === 'Failed'

            return (
              <React.Fragment key={sub.id}>
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/30' : ''}`}
                  onClick={() => toggleRow(sub.id)}
                >
                  <td className="px-4 py-3 text-slate-400">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{sub.id}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{sub.team}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{sub.lang}</td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                      isQueued ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                      isRunning ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' :
                      isCompleted ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
                      'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                    }`}>
                      {isQueued && <Clock size={12} />}
                      {isRunning && <PlayCircle size={12} className="animate-pulse" />}
                      {isCompleted && <CheckCircle2 size={12} />}
                      {isFailed && <XCircle size={12} />}
                      {sub.status}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{sub.tps}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{sub.p99}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">{sub.correctness}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{sub.concurrency}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">{sub.score}</td>
                  <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 text-xs">{sub.time}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded transition-colors" title="View Report">
                        <FileText size={16} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors" title="View Metrics">
                        <BarChart2 size={16} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded transition-colors" title="View Telemetry">
                        <Activity size={16} />
                      </button>
                      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                      <button className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
                <AnimatePresence>
                  {isExpanded && (
                    <tr>
                      <td colSpan={12} className="p-0 border-b border-slate-100 dark:border-slate-800">
                        <SubmissionRowDetails submissionId={sub.id} status={sub.status} />
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
