import { motion } from 'framer-motion';
import { Trophy, Zap, Clock, ShieldCheck, Activity } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';
import { formatNumber, formatPercent } from '@/utils/formatters';

interface SubmissionPerformanceSnapshotProps {
  entries: LeaderboardEntry[];
}

export function SubmissionPerformanceSnapshot({ entries }: SubmissionPerformanceSnapshotProps) {
  if (!entries || entries.length === 0) return null;

  // Derive stats
  const topScore = [...entries].sort((a, b) => b.finalScore - a.finalScore)[0];
  const topTps = [...entries].sort((a, b) => b.tps - a.tps)[0];
  const lowestP99 = [...entries].filter(e => e.p99 > 0).sort((a, b) => a.p99 - b.p99)[0];
  const perfectCorrectness = [...entries].filter(e => e.successRate >= 100).sort((a, b) => b.tps - a.tps)[0];

  const highlights = [
    { title: 'Highest Score', entry: topScore, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', format: (e: LeaderboardEntry) => formatNumber(e.finalScore) },
    { title: 'Highest TPS', entry: topTps, icon: Zap, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', format: (e: LeaderboardEntry) => formatNumber(e.tps) },
    { title: 'Lowest P99 Latency', entry: lowestP99, icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', format: (e: LeaderboardEntry) => `${e.p99.toFixed(0)} ms` },
    { title: 'Perfect Correctness (Max TPS)', entry: perfectCorrectness, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', format: (e: LeaderboardEntry) => formatPercent(e.successRate) },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Submission Performance Snapshot</h2>
        <p className="text-sm text-muted-foreground">Highlighting the absolute best submissions across critical evaluation vectors.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {highlights.map((highlight, idx) => (
          highlight.entry && (
            <div key={idx} className={`relative overflow-hidden rounded-[24px] border ${highlight.border} bg-gradient-to-b from-background to-muted/20 p-5`}>
              <div className="mb-4 flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${highlight.bg} ${highlight.color}`}>
                  <highlight.icon size={20} />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{highlight.title}</h3>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{highlight.entry.submissionName}</p>
                <p className="font-bold text-foreground">{highlight.entry.teamName}</p>
                <p className={`mt-2 text-2xl font-mono font-bold ${highlight.color}`}>
                  {highlight.format(highlight.entry)}
                </p>
              </div>
            </div>
          )
        ))}
      </div>
    </motion.section>
  );
}
