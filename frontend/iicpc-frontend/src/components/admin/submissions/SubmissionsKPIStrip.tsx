import { motion } from 'framer-motion';
import { FileCode, CheckCircle2, XCircle, Activity, Play, Video, Target, Trophy } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';

interface SubmissionsKPIStripProps {
  totalSubmissions: number;
  successfulDeployments: number;
  failedDeployments: number;
  runningPipelines: number;
  completedBenchmarks: number;
  replayReadyCount: number;
  averageScore: number;
  bestSubmissionScore: number;
}

export function SubmissionsKPIStrip({
  totalSubmissions,
  successfulDeployments,
  failedDeployments,
  runningPipelines,
  completedBenchmarks,
  replayReadyCount,
  averageScore,
  bestSubmissionScore
}: SubmissionsKPIStripProps) {
  const cards = [
    { title: 'Total Submissions', value: totalSubmissions, icon: FileCode, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', hover: 'hover:bg-blue-500/5' },
    { title: 'Successful Deploys', value: successfulDeployments, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hover: 'hover:bg-emerald-500/5' },
    { title: 'Failed Deploys', value: failedDeployments, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', hover: 'hover:bg-rose-500/5' },
    { title: 'Running Pipelines', value: runningPipelines, icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', hover: 'hover:bg-indigo-500/5' },
    { title: 'Completed Benchmarks', value: completedBenchmarks, icon: Play, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', hover: 'hover:bg-cyan-500/5' },
    { title: 'Replay Ready', value: replayReadyCount, icon: Video, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20', hover: 'hover:bg-violet-500/5' },
    { title: 'Average Score', value: formatNumber(averageScore), icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hover: 'hover:bg-amber-500/5' },
    { title: 'Best Score', value: formatNumber(bestSubmissionScore), icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hover: 'hover:bg-amber-500/5' },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Submission Executive Summary</h2>
        <p className="text-sm text-muted-foreground">High-level KPIs tracking submission volumes, health, and benchmark processing.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        {cards.map((card, idx) => (
          <div key={idx} className={`group relative overflow-hidden rounded-[24px] border ${card.border} bg-background p-4 transition-colors ${card.hover}`}>
            <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full ${card.bg} blur-[20px] transition-all group-hover:blur-[24px]`}></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className={`grid h-8 w-8 place-items-center rounded-full ${card.bg} ${card.color}`}>
                <card.icon size={16} />
              </div>
            </div>
            <div className="relative z-10 mt-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{card.title}</p>
              <p className="mt-1 text-xl font-bold text-foreground">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
