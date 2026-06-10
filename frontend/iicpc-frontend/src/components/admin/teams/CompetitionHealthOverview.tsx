import { motion } from 'framer-motion';
import { Activity, ShieldAlert, BarChart3, TrendingUp, Cpu } from 'lucide-react';
import { formatPercent } from '@/utils/formatters';

interface CompetitionHealthOverviewProps {
  totalRegisteredTeams: number;
  activeTeams: number;
  totalSubmissions: number;
  totalBenchmarks: number;
}

export function CompetitionHealthOverview({
  totalRegisteredTeams,
  activeTeams,
  totalSubmissions,
  totalBenchmarks
}: CompetitionHealthOverviewProps) {
  
  const participationRate = totalRegisteredTeams > 0 ? (activeTeams / totalRegisteredTeams) * 100 : 0;
  const submissionsPerTeam = activeTeams > 0 ? (totalSubmissions / activeTeams).toFixed(1) : '0';
  const leaderboardCoverage = activeTeams > 0 ? ((activeTeams / totalRegisteredTeams) * 100).toFixed(1) : '0';

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Competition Health Overview</h2>
        <p className="text-sm text-muted-foreground">Admin metrics to gauge overall platform engagement and system utilization.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <div className="group relative overflow-hidden rounded-[24px] border border-teal-500/20 bg-background p-5 transition-colors hover:bg-teal-500/5">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-500/10 text-teal-500">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Participation Rate</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{formatPercent(participationRate)}</p>
                <span className="text-xs text-teal-500">Healthy</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: `${participationRate}%` }} />
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-blue-500/20 bg-background p-5 transition-colors hover:bg-blue-500/5">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Submission Activity</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{submissionsPerTeam}</p>
                <span className="text-xs text-muted-foreground">per active team</span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-emerald-500/20 bg-background p-5 transition-colors hover:bg-emerald-500/5">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Cpu size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Benchmark Activity</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{totalBenchmarks}</p>
                <span className="text-xs text-muted-foreground">total executions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-indigo-500/20 bg-background p-5 transition-colors hover:bg-indigo-500/5">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Leaderboard Coverage</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{leaderboardCoverage}%</p>
                <span className="text-xs text-muted-foreground">of teams ranked</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${leaderboardCoverage}%` }} />
          </div>
        </div>

      </div>
    </motion.section>
  );
}
