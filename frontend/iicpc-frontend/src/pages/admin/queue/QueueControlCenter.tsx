import { Clock, PlayCircle, ShieldAlert, MoreHorizontal } from 'lucide-react'

const mockQueueJobs = [
  { id: 'JOB-9921', type: 'Benchmark', priority: 'High', status: 'Processing', worker: 'node-02', queuedAt: '2m ago', retries: 0 },
  { id: 'JOB-9922', type: 'Build', priority: 'Normal', status: 'Queued', worker: '-', queuedAt: '5m ago', retries: 0 },
  { id: 'JOB-9923', type: 'Validation', priority: 'High', status: 'Queued', worker: '-', queuedAt: '12m ago', retries: 1 },
  { id: 'JOB-9924', type: 'Benchmark', priority: 'Low', status: 'Failed (DLQ)', worker: 'node-04', queuedAt: '1h ago', retries: 3 },
  { id: 'JOB-9925', type: 'Deployment', priority: 'Normal', status: 'Processing', worker: 'node-01', queuedAt: '1m ago', retries: 0 },
]

export function QueueControlCenter() {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 font-semibold">Job ID</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Priority</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Assigned Worker</th>
            <th className="px-4 py-3 font-semibold text-right">Retries</th>
            <th className="px-4 py-3 font-semibold text-right">Queued At</th>
            <th className="px-4 py-3 font-semibold text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {mockQueueJobs.map((job) => {
            const isProcessing = job.status === 'Processing'
            const isQueued = job.status === 'Queued'
            const isFailed = job.status === 'Failed (DLQ)'

            return (
              <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{job.id}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{job.type}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    job.priority === 'High' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                    job.priority === 'Low' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {job.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                    isQueued ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' :
                    isProcessing ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20' :
                    'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                  }`}>
                    {isQueued && <Clock size={12} />}
                    {isProcessing && <PlayCircle size={12} className="animate-pulse" />}
                    {isFailed && <ShieldAlert size={12} />}
                    {job.status}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{job.worker}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{job.retries}</td>
                <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 text-xs">{job.queuedAt}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    <button className="p-1.5 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
