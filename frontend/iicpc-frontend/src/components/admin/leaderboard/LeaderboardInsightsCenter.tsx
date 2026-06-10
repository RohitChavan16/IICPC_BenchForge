import { motion } from 'framer-motion';
import { Lightbulb, Zap, Clock, ShieldCheck, Activity } from 'lucide-react';
import type { LiveLeaderboardEntry } from '@/hooks/useLeaderboardLiveState';

interface LeaderboardInsightsCenterProps {
  entries: LiveLeaderboardEntry[];
}

export function LeaderboardInsightsCenter({ entries }: LeaderboardInsightsCenterProps) {
  if (!entries || entries.length === 0) return null;

  const highestThroughput = [...entries].sort((a, b) => b.tps - a.tps)[0];
  const lowestLatency = [...entries].filter(e => e.p99 > 0).sort((a, b) => a.p99 - b.p99)[0];
  const mostConsistent = [...entries].filter(e => e.successRate >= 99.5).sort((a, b) => b.tps - a.tps)[0]; // Proxy for consistency

  const insights = [
    { label: 'Highest Throughput Team', team: highestThroughput?.teamName, icon: Zap, color: 'text-cyan-500' },
    { label: 'Lowest Latency Team', team: lowestLatency?.teamName, icon: Clock, color: 'text-indigo-500' },
    { label: 'Most Consistent Team', team: mostConsistent?.teamName, icon: ShieldCheck, color: 'text-emerald-500' },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Leaderboard Insights Center</h2>
        <p className="text-sm text-muted-foreground">Automated administrative insights derived from current competition data.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {insights.map((insight, idx) => (
          insight.team && (
            <div key={idx} className="flex items-center gap-4 rounded-[24px] border border-border bg-background p-5 hover:bg-muted/30 transition-colors">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted ${insight.color}`}>
                <insight.icon size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{insight.label}</p>
                <p className="mt-1 text-lg font-bold text-foreground truncate">{insight.team}</p>
              </div>
            </div>
          )
        ))}
      </div>
    </motion.section>
  );
}
