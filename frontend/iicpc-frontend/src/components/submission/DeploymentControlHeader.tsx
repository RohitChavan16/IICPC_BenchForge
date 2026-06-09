import React from 'react'
import { TerminalSquare } from 'lucide-react'

interface DeploymentControlHeaderProps {
  totalDeployments: number
  successfulSubmissions: number
  failedSubmissions: number
  activeJobs: number
  bestRank: number | null
  bestScore: number | null
  worstScore: number | null
}

export function DeploymentControlHeader({ 
  totalDeployments, 
  successfulSubmissions,
  failedSubmissions,
  activeJobs,
  bestRank,
  bestScore,
  worstScore
}: DeploymentControlHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 rounded-xl border border-border/40 bg-muted/30 dark:bg-[#0f121a]">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
          <TerminalSquare size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-wider text-indigo-700 dark:text-indigo-300 uppercase">Deployment History</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track all your engine submissions, scores, and deployment performance.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:gap-4 w-full md:w-auto">
        {/* Total Deployments */}
        <div className="flex flex-col items-center justify-center px-4 py-2.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 flex-1 min-w-[110px]">
          <span className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80 uppercase tracking-wider font-bold mb-1">Total</span>
          <span className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">{totalDeployments}</span>
        </div>

        {/* Successful Submissions */}
        <div className="flex flex-col items-center justify-center px-4 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex-1 min-w-[110px]">
          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-600/80 uppercase tracking-wider font-bold mb-1">Success</span>
          <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-500">{successfulSubmissions}</span>
        </div>

        {/* Failed Submissions */}
        <div className="flex flex-col items-center justify-center px-4 py-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 flex-1 min-w-[110px]">
          <span className="text-[10px] text-rose-700/80 dark:text-rose-500/80 uppercase tracking-wider font-bold mb-1">Failed</span>
          <span className="text-lg font-semibold text-rose-600 dark:text-rose-500">{failedSubmissions}</span>
        </div>

        {/* Active Jobs */}
        <div className="flex flex-col items-center justify-center px-4 py-2.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 flex-1 min-w-[110px]">
          <span className="text-[10px] text-cyan-700/80 dark:text-cyan-600/80 uppercase tracking-wider font-bold mb-1">Active</span>
          <span className="text-lg font-semibold text-cyan-600 dark:text-cyan-500">{activeJobs}</span>
        </div>

        {/* Best Rank */}
        <div className="flex flex-col items-center justify-center px-4 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 flex-1 min-w-[110px]">
          <span className="text-[10px] text-amber-700/80 dark:text-amber-600/80 uppercase tracking-wider font-bold mb-1">Best Rank</span>
          <span className="text-lg font-semibold text-amber-600 dark:text-amber-500">{bestRank ? `#${bestRank}` : '-'}</span>
        </div>

        {/* Best Score */}
        <div className="flex flex-col items-center justify-center px-4 py-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 flex-1 min-w-[110px]">
          <span className="text-[10px] text-purple-700/80 dark:text-purple-400/80 uppercase tracking-wider font-bold mb-1">Best Score</span>
          <span className="text-lg font-semibold text-purple-700 dark:text-purple-400">{bestScore !== null ? bestScore.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span>
        </div>

        {/* Worst Score */}
        <div className="flex flex-col items-center justify-center px-4 py-2.5 rounded-lg border border-orange-500/30 bg-orange-500/10 flex-1 min-w-[110px]">
          <span className="text-[10px] text-orange-700/80 dark:text-orange-500/80 uppercase tracking-wider font-bold mb-1">Worst Score</span>
          <span className="text-lg font-semibold text-orange-600 dark:text-orange-500">{worstScore !== null ? worstScore.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span>
        </div>
      </div>
    </div>
  )
}
