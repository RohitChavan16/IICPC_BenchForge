import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, Rocket } from 'lucide-react';
import type { LiveLeaderboardEntry } from '@/hooks/useLeaderboardLiveState';

interface LeaderboardMovementCenterProps {
  entries: LiveLeaderboardEntry[];
}

export function LeaderboardMovementCenter({ entries }: LeaderboardMovementCenterProps) {
  if (!entries || entries.length === 0) return null;

  // Derive movements
  const validRankChanges = entries.filter(e => typeof e.rankChange === 'number');
  
  const biggestIncrease = [...validRankChanges].sort((a, b) => (b.rankChange as number) - (a.rankChange as number))[0];
  const biggestDrop = [...validRankChanges].sort((a, b) => (a.rankChange as number) - (b.rankChange as number))[0];
  
  // Most improved team could be the biggest score jump recently (if we had it), or we can proxy with highest rank increase + good score
  const mostImproved = biggestIncrease; 
  
  // New entry with highest score
  const newEntries = entries.filter(e => e.rankChange === 'new');
  const highestNewEntry = newEntries.length > 0 ? [...newEntries].sort((a, b) => b.finalScore - a.finalScore)[0] : null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Leaderboard Movement Center</h2>
        <p className="text-sm text-muted-foreground">Administrative visibility into ranking volatility and significant positional changes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {biggestIncrease && (biggestIncrease.rankChange as number) > 0 && (
          <div className="rounded-[24px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-background p-5">
            <div className="flex items-center gap-2 mb-3 text-emerald-500">
              <TrendingUp size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Biggest Rank Increase</span>
            </div>
            <p className="text-lg font-bold text-foreground truncate">{biggestIncrease.teamName}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">+{biggestIncrease.rankChange}</span>
              <span className="text-sm text-muted-foreground">positions</span>
            </div>
          </div>
        )}

        {biggestDrop && (biggestDrop.rankChange as number) < 0 && (
          <div className="rounded-[24px] border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-background p-5">
            <div className="flex items-center gap-2 mb-3 text-rose-500">
              <TrendingDown size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Biggest Rank Drop</span>
            </div>
            <p className="text-lg font-bold text-foreground truncate">{biggestDrop.teamName}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400">{biggestDrop.rankChange}</span>
              <span className="text-sm text-muted-foreground">positions</span>
            </div>
          </div>
        )}

        {highestNewEntry && (
          <div className="rounded-[24px] border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-background p-5">
            <div className="flex items-center gap-2 mb-3 text-blue-500">
              <Rocket size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Fastest Rising Competitor</span>
            </div>
            <p className="text-lg font-bold text-foreground truncate">{highestNewEntry.teamName}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-400">NEW</span>
              <span className="text-sm text-muted-foreground">at Rank #{highestNewEntry.rank}</span>
            </div>
          </div>
        )}

        {mostImproved && (
          <div className="rounded-[24px] border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-background p-5">
            <div className="flex items-center gap-2 mb-3 text-amber-500">
              <ArrowUpRight size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Most Improved Team</span>
            </div>
            <p className="text-lg font-bold text-foreground truncate">{mostImproved.teamName}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">#{mostImproved.rank}</span>
              <span className="text-sm text-muted-foreground">current rank</span>
            </div>
          </div>
        )}

      </div>
    </motion.section>
  );
}
