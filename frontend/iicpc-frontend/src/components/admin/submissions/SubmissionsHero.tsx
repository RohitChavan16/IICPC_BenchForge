import { motion } from 'framer-motion';
import { Inbox, Activity, CheckCircle2, Target, Shield, Clock } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';

interface SubmissionsHeroProps {
  totalSubmissions: number;
  runningPipelines: number;
  completedBenchmarks: number;
  failedSubmissions: number;
  replayReady: number;
  bestScore: number;
}

export function SubmissionsHero({
  totalSubmissions,
  runningPipelines,
  completedBenchmarks,
  failedSubmissions,
  replayReady,
  bestScore
}: SubmissionsHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden border-b border-border bg-orange-50/50 dark:bg-orange-950/10 px-6 py-12 md:px-12 lg:px-16"
    >
      <div className="relative z-10 flex flex-col gap-10 w-full max-w-7xl mx-auto">
        
        {/* Top: Title and Description */}
        <div className="max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            <Shield size={14} className="animate-pulse" />
            Administration Console
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Submission Management
          </h1>
          
          <p className="mt-4 text-base font-medium text-muted-foreground leading-relaxed max-w-3xl">
            Monitor incoming code submissions, track pipeline execution status, and oversee the validation and benchmarking process.
          </p>
        </div>

        {/* Bottom: Operational Stats (Tags/Cards) */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 w-full">
          
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><Inbox size={14}/> Total Processed</p>
            <p className="mt-1.5 text-2xl font-black text-blue-700 dark:text-blue-300">{formatNumber(totalSubmissions)}</p>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1.5"><Activity size={14}/> In Flight</p>
            <p className="mt-1.5 text-2xl font-black text-orange-700 dark:text-orange-300">{formatNumber(runningPipelines)}</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 size={14}/> Completed</p>
            <p className="mt-1.5 text-2xl font-black text-emerald-700 dark:text-emerald-300">{formatNumber(completedBenchmarks)}</p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5"><Activity size={14}/> Failed</p>
            <p className="mt-1.5 text-2xl font-black text-rose-700 dark:text-rose-300">{formatNumber(failedSubmissions)}</p>
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5"><Clock size={14}/> Replays Ready</p>
            <p className="mt-1.5 text-2xl font-black text-violet-700 dark:text-violet-300">{formatNumber(replayReady)}</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5"><Target size={14}/> Best Score</p>
            <p className="mt-1.5 text-2xl font-black text-amber-700 dark:text-amber-300">{formatNumber(bestScore)}</p>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
