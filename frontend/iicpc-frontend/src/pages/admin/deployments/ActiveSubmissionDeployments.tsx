import { PlayCircle, ShieldAlert, CheckCircle2, MoreHorizontal } from 'lucide-react'

const mockDeployments = [
  { id: 'DEP-8841', submissionId: 'SUB-1042', team: 'Team Alpha', container: 'alpha-sub-1042:v1', status: 'Running', uptime: '4h 12m', cpu: '14%', memory: '240MB' },
  { id: 'DEP-8842', submissionId: 'SUB-1043', team: 'Team Beta', container: 'beta-sub-1043:v2', status: 'Starting', uptime: '1m', cpu: '85%', memory: '105MB' },
  { id: 'DEP-8843', submissionId: 'SUB-1044', team: 'Team Gamma', container: 'gamma-sub-1044:v1', status: 'Running', uptime: '2h 45m', cpu: '2%', memory: '180MB' },
  { id: 'DEP-8844', submissionId: 'SUB-1045', team: 'Team Delta', container: 'delta-sub-1045:v1', status: 'Failed', uptime: '0m', cpu: '0%', memory: '0MB' },
]

export function ActiveSubmissionDeployments() {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 font-semibold">Deploy ID</th>
            <th className="px-4 py-3 font-semibold">Submission</th>
            <th className="px-4 py-3 font-semibold">Team</th>
            <th className="px-4 py-3 font-semibold">Container Image</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold text-right">Uptime</th>
            <th className="px-4 py-3 font-semibold text-right">CPU</th>
            <th className="px-4 py-3 font-semibold text-right">Memory</th>
            <th className="px-4 py-3 font-semibold text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {mockDeployments.map((dep) => {
            const isRunning = dep.status === 'Running'
            const isStarting = dep.status === 'Starting'
            const isFailed = dep.status === 'Failed'

            return (
              <tr key={dep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{dep.id}</td>
                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{dep.submissionId}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{dep.team}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{dep.container}</td>
                <td className="px-4 py-3">
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                    isRunning ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
                    isStarting ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20' :
                    'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                  }`}>
                    {isRunning && <CheckCircle2 size={12} />}
                    {isStarting && <PlayCircle size={12} className="animate-pulse" />}
                    {isFailed && <ShieldAlert size={12} />}
                    {dep.status}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{dep.uptime}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{dep.cpu}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{dep.memory}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    <button className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded transition-colors">
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
