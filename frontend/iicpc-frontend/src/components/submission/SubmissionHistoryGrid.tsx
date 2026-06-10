import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Rocket, Info, ChevronLeft, ChevronRight, MoreHorizontal, ChevronDown } from 'lucide-react'
import { SubmissionHistoryRow } from './SubmissionHistoryRow'
import type { Submission } from '@/services/api/submissionService'
import type { LeaderboardEntry } from '@/types/api'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'

interface SubmissionHistoryGridProps {
  submissions: Submission[]
  leaderboard: LeaderboardEntry[]
  isLoading: boolean
}

export function SubmissionHistoryGrid({ submissions, leaderboard, isLoading }: SubmissionHistoryGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  if (isLoading) {
    return (
      <div className="w-full bg-[#0f121a] border border-border/40 rounded-xl overflow-hidden mt-6">
        <div className="p-8 flex flex-col items-center justify-center animate-pulse gap-4">
          <div className="h-8 w-8 bg-border/50 rounded-full" />
          <div className="h-4 w-48 bg-border/50 rounded" />
        </div>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-12 lg:p-24 border border-border/40 rounded-xl bg-[#0f121a] text-center mt-6"
      >
        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
          <Rocket size={40} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">No Deployments Yet</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-sm">
          Upload your first engine package to see real-time metrics, benchmark analysis, and replay generation.
        </p>
        <div className="flex items-center gap-4">
          <Link to="/submit">
            <Button size="default" className="font-bold bg-indigo-600 hover:bg-indigo-500 text-white border-transparent">Submit First Engine</Button>
          </Link>
        </div>
      </motion.div>
    )
  }

  const totalPages = Math.ceil(submissions.length / itemsPerPage)
  const paginatedSubmissions = submissions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="w-full bg-card dark:bg-[#0f121a] border border-border/40 rounded-xl flex flex-col shadow-sm dark:shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-muted-foreground border-collapse table-fixed lg:table-auto min-w-full">
          <thead className="bg-muted/50 dark:bg-[#161a23] border-b border-border/40 text-xs text-muted-foreground uppercase tracking-wider text-left sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-2 lg:px-4 py-3 font-semibold w-1/5 lg:w-auto">Engine</th>
              <th className="px-2 lg:px-4 py-3 font-semibold hidden md:table-cell">File</th>
              <th className="px-2 lg:px-4 py-3 font-semibold">Lang</th>
              <th className="px-2 lg:px-4 py-3 font-semibold">Status</th>
              <th className="px-2 lg:px-4 py-3 font-semibold w-[15%]">Rank</th>
              <th className="px-2 lg:px-4 py-3 font-semibold w-[15%]">Score</th>
              <th className="px-2 lg:px-4 py-3 font-semibold hidden xl:table-cell w-[15%]">Created At</th>
              <th className="px-2 lg:px-4 py-3 font-semibold text-right w-[10%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSubmissions.map((sub, idx) => (
              <SubmissionHistoryRow 
                key={sub.id}
                submission={sub} 
                leaderboardEntry={leaderboard.find(l => (l as any).submissionId === sub.id)} 
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-border/40 bg-card dark:bg-[#0f121a] rounded-b-xl gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, submissions.length)} of {submissions.length} results
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded text-muted-foreground hover:bg-muted dark:hover:bg-[#1f2430] hover:text-foreground disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                // Simple pagination logic for display
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button 
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                        currentPage === page 
                          ? 'bg-indigo-600 text-white' 
                          : 'text-muted-foreground hover:bg-muted dark:hover:bg-[#1f2430] hover:text-foreground'
                      }`}
                    >
                      {page}
                    </button>
                  )
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <MoreHorizontal key={page} size={16} className="text-muted-foreground mx-1" />
                }
                return null;
              })}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded text-muted-foreground hover:bg-muted dark:hover:bg-[#1f2430] hover:text-foreground disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="relative">
            <select 
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-background dark:bg-transparent border border-border/50 rounded-lg pl-3 pr-8 py-1.5 text-sm outline-none focus:border-indigo-500/50 appearance-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
          </div>
        </div>
      </div>
    </div>
  )
}
