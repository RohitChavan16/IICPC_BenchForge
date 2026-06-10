import { motion } from 'framer-motion';
import { Trophy, Activity, Zap, Clock, ShieldCheck } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';
import { formatNumber, formatPercent } from '@/utils/formatters';

interface TeamPerformanceSnapshotProps {
  entries: LeaderboardEntry[];
}

export function TeamPerformanceSnapshot({ entries }: TeamPerformanceSnapshotProps) {
  if (!entries || entries.length === 0) return null;

  // Derive stats safely
  const topPerformers = [...entries].sort((a, b) => b.finalScore - a.finalScore).slice(0, 3);
  const mostActive = [...entries].sort((a, b) => b.totalRequests - a.totalRequests).slice(0, 3);
  const highestTps = [...entries].sort((a, b) => b.tps - a.tps).slice(0, 3);
  const highestCorrectness = [...entries].sort((a, b) => b.successRate - a.successRate).slice(0, 3);
  const lowestLatency = [...entries].sort((a, b) => a.p99 - b.p99).slice(0, 3);

  const categories = [
    { title: 'Top Performing', data: topPerformers, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', format: (e: LeaderboardEntry) => formatNumber(e.finalScore) },
    { title: 'Most Active', data: mostActive, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', format: (e: LeaderboardEntry) => formatNumber(e.totalRequests) },
    { title: 'Highest TPS', data: highestTps, icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', format: (e: LeaderboardEntry) => formatNumber(e.tps) },
    { title: 'Lowest Latency', data: lowestLatency, icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', format: (e: LeaderboardEntry) => `${e.p99.toFixed(0)}ms` },
    { title: 'Best Correctness', data: highestCorrectness, icon: ShieldCheck, color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20', format: (e: LeaderboardEntry) => formatPercent(e.successRate) },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Team Performance Snapshot</h2>
        <p className="text-sm text-muted-foreground">Quick highlights of exceptional team metrics across the competition.</p>
      </div>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
        {categories.map((cat, idx) => (
          <div key={idx} className={`min-w-[280px] snap-center rounded-[24px] border ${cat.border} bg-gradient-to-b from-background to-muted/20 p-5 lg:min-w-0`}>
            <div className="mb-4 flex items-center gap-3">
              <div className={`grid h-8 w-8 place-items-center rounded-lg ${cat.bg} ${cat.color}`}>
                <cat.icon size={16} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{cat.title}</h3>
            </div>
            <div className="space-y-3">
              {cat.data.map((team, rank) => (
                <div key={team.id || team.teamName} className="flex items-center justify-between border-t border-border pt-3 first:border-0 first:pt-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-bold text-muted-foreground">#{rank + 1}</span>
                    <span className="truncate text-sm font-medium text-foreground">{team.teamName}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${cat.color}`}>{cat.format(team)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
