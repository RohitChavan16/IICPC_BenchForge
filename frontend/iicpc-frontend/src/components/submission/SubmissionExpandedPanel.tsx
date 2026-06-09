import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Activity, Zap, ShieldCheck, Clock, Hash, FileArchive, Server } from 'lucide-react'
import type { LeaderboardEntry } from '@/types/api'
import type { Submission } from '@/services/api/submissionService'

interface SubmissionExpandedPanelProps {
  submission: Submission
  leaderboardEntry?: LeaderboardEntry
}

export function SubmissionExpandedPanel({ submission, leaderboardEntry }: SubmissionExpandedPanelProps) {
  const container = {
    hidden: { opacity: 0, height: 0 },
    show: { 
      opacity: 1, 
      height: 'auto',
      transition: { 
        height: { duration: 0.3, ease: 'easeOut' },
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      exit="hidden"
      className="border-t border-border bg-muted/10 overflow-hidden"
    >
      <div className="p-6 md:p-8 space-y-8">
        
        {/* Performance Snapshot */}
        <motion.div variants={item} className="space-y-4">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            Performance Snapshot
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            <MetricCard 
              label="Rank" 
              value={leaderboardEntry?.rank ? `#${leaderboardEntry.rank}` : '-'} 
              icon={Trophy} 
              colorClass="text-amber-500 bg-amber-500/10 border-amber-500/20"
            />
            
            <MetricCard 
              label="Score" 
              value={leaderboardEntry?.finalScore ? leaderboardEntry.finalScore.toFixed(2) : '-'} 
              icon={Activity} 
              colorClass="text-violet-500 bg-violet-500/10 border-violet-500/20"
            />
            
            <MetricCard 
              label="Peak TPS" 
              value={leaderboardEntry?.tps ? leaderboardEntry.tps.toLocaleString() : '-'} 
              icon={Zap} 
              colorClass="text-cyan-500 bg-cyan-500/10 border-cyan-500/20"
            />
            
            <MetricCard 
              label="Best P99" 
              value={leaderboardEntry?.p99 ? `${leaderboardEntry.p99}ms` : '-'} 
              icon={Clock} 
              colorClass="text-blue-500 bg-blue-500/10 border-blue-500/20"
            />
            
            <MetricCard 
              label="Correctness" 
              value={leaderboardEntry?.correctnessScore ? `${leaderboardEntry.correctnessScore.toFixed(1)}%` : '-'} 
              icon={ShieldCheck} 
              colorClass="text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
            />
            
          </div>
        </motion.div>

        {/* Metadata Details */}
        <motion.div variants={item} className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
             <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
               <FileArchive size={16} className="text-muted-foreground" />
               Submission Metadata
             </h4>
             <div className="bg-card border border-border rounded-xl p-4 space-y-3">
               <DetailRow label="Submission ID" value={submission.id} />
               <DetailRow label="Language" value={submission.language} />
               <DetailRow label="Created At" value={new Date(submission.createdAt).toLocaleString()} />
               {submission.startedAt && <DetailRow label="Started At" value={new Date(submission.startedAt).toLocaleString()} />}
               {submission.finishedAt && <DetailRow label="Finished At" value={new Date(submission.finishedAt).toLocaleString()} />}
             </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
               <Server size={16} className="text-muted-foreground" />
               Benchmark Summary
             </h4>
             <div className="bg-card border border-border rounded-xl p-4 space-y-3">
               <DetailRow label="Benchmark Status" value={submission.currentStage || 'UNKNOWN'} />
               <DetailRow label="Success Rate" value={leaderboardEntry?.successRate !== undefined ? `${leaderboardEntry.successRate.toFixed(2)}%` : '-'} />
               <DetailRow label="Total Requests" value={leaderboardEntry?.totalRequests ? leaderboardEntry.totalRequests.toLocaleString() : '-'} />
               <DetailRow label="Duration" value={leaderboardEntry?.duration ? `${leaderboardEntry.duration}s` : '-'} />
             </div>
          </div>
        </motion.div>
        
      </div>
    </motion.div>
  )
}

function MetricCard({ label, value, icon: Icon, colorClass }: { label: string, value: string | number, icon: React.ElementType, colorClass: string }) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${colorClass.split(' ')[1]} ${colorClass.split(' ')[2]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</span>
        <Icon size={16} className={colorClass.split(' ')[0]} />
      </div>
      <span className={`text-xl font-black ${colorClass.split(' ')[0]}`}>{value}</span>
    </div>
  )
}

function DetailRow({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-foreground font-semibold font-mono text-xs">{value}</span>
    </div>
  )
}
