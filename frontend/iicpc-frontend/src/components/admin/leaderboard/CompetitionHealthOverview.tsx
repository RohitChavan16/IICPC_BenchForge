import { motion } from 'framer-motion';
import { Activity, Users, ShieldAlert, BarChart3, TrendingUp } from 'lucide-react';
import type { LiveLeaderboardEntry } from '@/hooks/useLeaderboardLiveState';
import { formatPercent } from '@/utils/formatters';

interface CompetitionHealthOverviewProps {
  entries: LiveLeaderboardEntry[];
  totalTeamsSystemWide: number;
}

export function CompetitionHealthOverview({ entries, totalTeamsSystemWide }: CompetitionHealthOverviewProps) {
  if (!entries || entries.length === 0) return null;

  const totalRanked = entries.length;
  const participationRate = totalTeamsSystemWide > 0 ? (totalRanked / totalTeamsSystemWide) * 100 : 100;
  
  // Calculate stability: percentage of teams that haven't moved or moved very little recently
  const stableTeams = entries.filter(e => typeof e.rankChange === 'number' && Math.abs(e.rankChange) <= 1).length;
  const stabilityRate = totalRanked > 0 ? (stableTeams / totalRanked) * 100 : 100;

  // Active teams proxy (teams with high TPS)
  const activeTeams = entries.filter(e => e.tps > 100).length;
  const activityRate = totalRanked > 0 ? (activeTeams / totalRanked) * 100 : 0;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Competition Health Overview</h2>
        <p className="text-sm text-muted-foreground">Administrative visibility into platform-wide competition participation and ranking stability.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        
        <div className="group relative overflow-hidden rounded-[24px] border border-orange-500/20 bg-background p-5 transition-colors hover:bg-orange-500/5">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
              <Users size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Participation Rate</p>
              <div className="mt-1 flex items-baseline justify-between">
                <p className="text-2xl font-bold text-foreground">{formatPercent(participationRate)}</p>
                <span className="text-xs text-muted-foreground">{totalRanked} / {totalTeamsSystemWide} Teams</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${participationRate}%` }} />
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-amber-500/20 bg-background p-5 transition-colors hover:bg-amber-500/5">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldAlert size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Leaderboard Stability</p>
              <div className="mt-1 flex items-baseline justify-between">
                <p className="text-2xl font-bold text-foreground">{formatPercent(stabilityRate)}</p>
                <span className="text-xs text-muted-foreground">±1 Rank Change</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${stabilityRate}%` }} />
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-emerald-500/20 bg-background p-5 transition-colors hover:bg-emerald-500/5">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Activity size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">High-Activity Competitors</p>
              <div className="mt-1 flex items-baseline justify-between">
                <p className="text-2xl font-bold text-foreground">{formatPercent(activityRate)}</p>
                <span className="text-xs text-muted-foreground">{activeTeams} Teams &gt; 100 TPS</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${activityRate}%` }} />
          </div>
        </div>

      </div>
    </motion.section>
  );
}
