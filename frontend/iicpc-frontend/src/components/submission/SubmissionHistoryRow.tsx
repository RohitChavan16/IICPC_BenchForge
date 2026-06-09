import React from 'react'
import { Box, File, CheckCircle2, XCircle, Loader2, Trophy, ShieldCheck, Eye, Trash2 } from 'lucide-react'
import type { Submission } from '@/services/api/submissionService'
import type { LeaderboardEntry } from '@/types/api'
import { Link } from 'react-router-dom'

interface SubmissionHistoryRowProps {
  submission: Submission
  leaderboardEntry?: LeaderboardEntry
}

export function SubmissionHistoryRow({ submission, leaderboardEntry }: SubmissionHistoryRowProps) {
  const statusLower = submission.status.toLowerCase()
  const isFailed = statusLower === 'failed'
  const isCancelled = statusLower === 'cancelled'
  const isRunning = statusLower === 'running'
  const isCompleted = statusLower === 'completed'

  const createdDate = new Date(submission.createdAt)
  
  // Format dates: 9 Jun 2026 \n 09:05 AM
  const dateFormatted = createdDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeFormatted = createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  // Determine colors based on status
  let statusIcon = <CheckCircle2 size={16} />
  let statusColor = 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
  if (isFailed) {
    statusIcon = <XCircle size={16} />
    statusColor = 'text-rose-500 border-rose-500/20 bg-rose-500/10'
  } else if (isRunning) {
    statusIcon = <Loader2 size={16} className="animate-spin" />
    statusColor = 'text-cyan-500 border-cyan-500/20 bg-cyan-500/10'
  } else if (isCancelled) {
    statusIcon = <XCircle size={16} />
    statusColor = 'text-slate-500 border-slate-500/20 bg-slate-500/10'
  }

  // Mock Sparkline SVG component
  const Sparkline = ({ colorClass }: { colorClass: string }) => (
    <svg className={`w-16 h-6 ${colorClass}`} viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M0 25 L10 20 L20 28 L30 15 L40 18 L50 5 L60 22 L70 10 L80 15 L90 2 L100 10" />
    </svg>
  )

  const showDashes = isFailed || isCancelled || isRunning

  // Extract dummy values or use leaderboard if available
  const rank = leaderboardEntry?.rank || Math.floor(Math.random() * 10) + 1
  const score = leaderboardEntry?.finalScore || (Math.random() * 2000).toFixed(2)
  const p99 = (Math.random() * 300 + 50).toFixed(0)
  const concurrency = (Math.random() * 20000 + 5000).toLocaleString(undefined, { maximumFractionDigits: 0 })
  const correctness = leaderboardEntry?.correctnessScore || (Math.random() * 5 + 95).toFixed(1)

  return (
    <tr className="border-b border-border/40 hover:bg-muted/50 dark:hover:bg-[#1a1f2c] transition-colors group">
      {/* Engine / Submission */}
      <td className="px-2 lg:px-4 py-2 lg:py-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 shrink-0">
            <Box size={16} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground text-sm truncate max-w-[120px] lg:max-w-[140px]" title={submission.submissionName}>{submission.submissionName}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">#{submission.id.substring(0,4)}</span>
          </div>
        </div>
      </td>

      {/* File / Size */}
      <td className="px-2 lg:px-4 py-2 lg:py-2.5 hidden md:table-cell">
        <div className="flex items-center gap-1.5">
          <File size={14} className="text-indigo-400 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-foreground truncate max-w-[100px] lg:max-w-[120px]" title={`${submission.submissionName}.zip`}>{`${submission.submissionName}.zip`}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">{(Math.random() * 15 + 5).toFixed(2)} MB</span>
          </div>
        </div>
      </td>

      <td className="px-2 lg:px-4 py-2 lg:py-2.5">
        <span className={`px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-semibold bg-muted dark:bg-[#252b3d] border border-border/50 text-muted-foreground capitalize`}>
          {submission.language === 'cpp' ? 'C++' : submission.language}
        </span>
      </td>

      {/* Status */}
      <td className="px-2 lg:px-4 py-2 lg:py-2.5">
        <div className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-bold uppercase border ${statusColor}`}>
          {statusIcon}
          {submission.status}
        </div>
      </td>

      {/* Rank */}
      <td className="px-2 lg:px-4 py-2 lg:py-2.5">
        {showDashes && !leaderboardEntry ? (
          <span className="text-muted-foreground">---</span>
        ) : (
          <span className="flex items-center gap-1 text-sm font-bold text-foreground">
            <Trophy size={14} className={rank === 1 ? 'text-amber-500' : 'text-slate-400'} />
            #{rank}
          </span>
        )}
      </td>

      {/* Score */}
      <td className="px-2 lg:px-4 py-2 lg:py-2.5">
        {showDashes && !leaderboardEntry ? (
          <span className="text-muted-foreground">---</span>
        ) : (
          <span className="text-sm text-indigo-400 font-semibold">{score}</span>
        )}
      </td>

      {/* Created At */}
      <td className="px-2 lg:px-4 py-2 lg:py-2.5 hidden xl:table-cell">
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-sm text-foreground">{dateFormatted}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {timeFormatted}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-2 lg:px-4 py-2 lg:py-2.5 text-right">
        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <Link to={`/submissions/${submission.id}/report`}>
            <button className="p-1.5 rounded-lg bg-muted dark:bg-[#252b3d] text-indigo-500 dark:text-indigo-400 hover:bg-muted/80 dark:hover:bg-[#2d344a] hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors border border-border/50">
              <Eye size={16} />
            </button>
          </Link>
          <button className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-500 hover:bg-rose-500/20 transition-colors border border-rose-500/20">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}
