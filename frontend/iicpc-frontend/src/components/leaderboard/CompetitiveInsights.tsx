import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, ShieldCheck, TrendingUp } from 'lucide-react';
import type { LeaderboardLiveStateEntry } from '@/hooks/useLeaderboardLiveState';
import { formatNumber, formatPercent } from '@/utils/formatters';

interface CompetitiveInsightsProps {
  entries: LeaderboardLiveStateEntry[];
}

export function CompetitiveInsights({ entries }: CompetitiveInsightsProps) {
  const insights = useMemo(() => {
    if (entries.length === 0) return null;

    const highestTps = entries.reduce((prev, current) => (prev.tps > current.tps ? prev : current));
    const lowestLatency = entries.reduce((prev, current) => (prev.p99 < current.p99 ? prev : current));
    const mostConsistent = entries.reduce((prev, current) => (prev.successRate > current.successRate ? prev : current));
    const fastestRising = entries.reduce((prev, current) => (prev.rankDelta > current.rankDelta ? prev : current));

    return { highestTps, lowestLatency, mostConsistent, fastestRising };
  }, [entries]);

  if (!insights) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Competitive Insights</h2>
        <p className="text-sm text-muted-foreground">Key architectural advantages discovered across the fleet.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Highest Throughput */}
        <div className="group relative overflow-hidden rounded-[24px] border border-emerald-500/20 bg-gradient-to-br from-emerald-950/5 to-background p-6 transition-colors hover:bg-emerald-500/5">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-[32px]"></div>
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
              <Zap size={14} /> Highest Throughput
            </div>
            <p className="text-xl font-bold text-foreground">{insights.highestTps.teamName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{insights.highestTps.submissionName}</p>
            <div className="mt-4 border-t border-emerald-500/10 pt-4">
              <p className="font-mono text-xl text-emerald-400">{formatNumber(insights.highestTps.tps)} TPS</p>
            </div>
          </div>
        </div>

        {/* Lowest Latency */}
        <div className="group relative overflow-hidden rounded-[24px] border border-emerald-500/20 bg-gradient-to-br from-emerald-950/5 to-background p-6 transition-colors hover:bg-emerald-500/5">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-[32px]"></div>
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
              <Clock size={14} /> Lowest Latency
            </div>
            <p className="text-xl font-bold text-foreground">{insights.lowestLatency.teamName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{insights.lowestLatency.submissionName}</p>
            <div className="mt-4 border-t border-emerald-500/10 pt-4">
              <p className="font-mono text-xl text-emerald-400">{insights.lowestLatency.p99.toFixed(0)} ms P99</p>
            </div>
          </div>
        </div>

        {/* Most Consistent */}
        <div className="group relative overflow-hidden rounded-[24px] border border-emerald-500/20 bg-gradient-to-br from-emerald-950/5 to-background p-6 transition-colors hover:bg-emerald-500/5">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-[32px]"></div>
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
              <ShieldCheck size={14} /> Most Consistent
            </div>
            <p className="text-xl font-bold text-foreground">{insights.mostConsistent.teamName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{insights.mostConsistent.submissionName}</p>
            <div className="mt-4 border-t border-emerald-500/10 pt-4">
              <p className="font-mono text-xl text-emerald-400">{formatPercent(insights.mostConsistent.successRate)} Success</p>
            </div>
          </div>
        </div>

        {/* Fastest Rising */}
        <div className="group relative overflow-hidden rounded-[24px] border border-emerald-500/20 bg-gradient-to-br from-emerald-950/5 to-background p-6 transition-colors hover:bg-emerald-500/5">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-[32px]"></div>
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
              <TrendingUp size={14} /> Fastest Rising
            </div>
            {insights.fastestRising.rankDelta > 0 ? (
              <>
                <p className="text-xl font-bold text-foreground">{insights.fastestRising.teamName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{insights.fastestRising.submissionName}</p>
                <div className="mt-4 border-t border-emerald-500/10 pt-4">
                  <p className="font-mono text-xl text-emerald-400">+{insights.fastestRising.rankDelta} Positions</p>
                </div>
              </>
            ) : (
              <div className="mt-8 text-center text-sm text-muted-foreground">
                No active climbers
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
