import { motion } from 'framer-motion';
import { Video, BarChart2 } from 'lucide-react';
import type { LiveLeaderboardEntry } from '@/hooks/useLeaderboardLiveState';
import { formatPercent } from '@/utils/formatters';

interface ReplayImpactAnalyticsProps {
  entries: LiveLeaderboardEntry[];
}

export function ReplayImpactAnalytics({ entries }: ReplayImpactAnalyticsProps) {
  if (!entries || entries.length === 0) return null;

  // Derive replay states based on benchmark completion
  const total = entries.length;
  const ready = entries.filter(e => e.finalScore > 0).length; // Proxied by finalScore existence
  
  const coverageRate = total > 0 ? (ready / total) * 100 : 0;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Replay Impact Analytics</h2>
        <p className="text-sm text-muted-foreground">Monitor Replay Engine adoption and generation coverage across the leaderboard.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        
        <div className="group relative overflow-hidden rounded-[24px] border border-violet-500/20 bg-background p-5 transition-colors hover:bg-violet-500/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
              <Video size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Leaderboard Replay Coverage</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-foreground">{formatPercent(coverageRate)}</p>
                <span className="text-xs text-muted-foreground">{ready} / {total} Submissions</span>
              </div>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-violet-500 transition-all duration-1000" style={{ width: `${coverageRate}%` }} />
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-cyan-500/20 bg-background p-5 flex flex-col justify-center transition-colors hover:bg-cyan-500/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-500">
              <BarChart2 size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Generated Replays</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-foreground">{ready}</p>
                <span className="text-xs text-muted-foreground">Available to view</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.section>
  );
}
