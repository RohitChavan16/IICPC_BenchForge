import { motion } from 'framer-motion';
import { GitMerge, Layers, CheckCircle2, XCircle, Clock, Video } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';

interface PipelineOperationsHeroProps {
  activePipelines: number;
  successfulToday: number;
  failedToday: number;
  avgBuildTimeMs: number;
  avgValidationTimeMs: number;
  replaysGenerated: number;
}

export function PipelineOperationsHero({
  activePipelines,
  successfulToday,
  failedToday,
  avgBuildTimeMs,
  avgValidationTimeMs,
  replaysGenerated
}: PipelineOperationsHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden border-b border-border bg-slate-50 dark:bg-background px-6 py-12 md:px-12 lg:px-16"
    >
      <div className="relative z-10 flex flex-col gap-10 w-full max-w-7xl mx-auto">
        
        {/* Top: Title and Description */}
        <div className="max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            <GitMerge size={14} className="animate-pulse" />
            Infrastructure Operations
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Pipeline Operations Center
          </h1>
          
          <p className="mt-4 text-base font-medium text-muted-foreground leading-relaxed max-w-3xl">
            Monitor build pipelines, deployment execution, validation stages, benchmark orchestration, replay generation, and platform workflow health in real time.
          </p>
        </div>

        {/* Bottom: Operational Stats (Tags/Cards) */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 w-full">
          
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><Layers size={14}/> Active Pipelines</p>
            <p className="mt-1.5 text-2xl font-black text-blue-700 dark:text-blue-300">{formatNumber(activePipelines)}</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 size={14}/> Successful Today</p>
            <p className="mt-1.5 text-2xl font-black text-emerald-700 dark:text-emerald-300">{formatNumber(successfulToday)}</p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5"><XCircle size={14}/> Failed Today</p>
            <p className="mt-1.5 text-2xl font-black text-rose-700 dark:text-rose-300">{formatNumber(failedToday)}</p>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5"><Clock size={14}/> Avg Build</p>
            <p className="mt-1.5 text-2xl font-black text-indigo-700 dark:text-indigo-300">{avgBuildTimeMs > 0 ? `${(avgBuildTimeMs / 1000).toFixed(1)}s` : '-'}</p>
          </div>

          <div className="rounded-xl border border-cyan-200 bg-cyan-50 dark:border-cyan-500/20 dark:bg-cyan-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5"><Clock size={14}/> Avg Validate</p>
            <p className="mt-1.5 text-2xl font-black text-cyan-700 dark:text-cyan-300">{avgValidationTimeMs > 0 ? `${(avgValidationTimeMs / 1000).toFixed(1)}s` : '-'}</p>
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5"><Video size={14}/> Replays</p>
            <p className="mt-1.5 text-2xl font-black text-violet-700 dark:text-violet-300">{formatNumber(replaysGenerated)}</p>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
