import { motion } from 'framer-motion';
import { ShieldCheck, Server, Video, Activity, Play } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';
import { formatPercent } from '@/utils/formatters';

interface PlatformHealthOverviewProps {
  entries: LeaderboardEntry[];
}

export function PlatformHealthOverview({ entries }: PlatformHealthOverviewProps) {
  if (!entries || entries.length === 0) return null;

  const total = entries.length;
  const validations = entries.filter(e => e.successRate >= 99.5).length;
  const benchmarks = entries.filter(e => e.finalScore > 0).length;
  
  const validationSuccessRate = total > 0 ? (validations / total) * 100 : 0;
  const benchmarkSuccessRate = total > 0 ? (benchmarks / total) * 100 : 0;
  
  // High utilization proxy: percentage of teams successfully processed
  const utilization = total > 0 ? ((validations + benchmarks) / (total * 2)) * 100 : 0;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Platform Health Overview</h2>
        <p className="text-sm text-muted-foreground">Administrative insights into pipeline success rates and platform utilization.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <div className="group relative overflow-hidden rounded-[24px] border border-indigo-500/20 bg-background p-5 transition-colors hover:bg-indigo-500/5">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Validation Success Rate</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{formatPercent(validationSuccessRate)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-cyan-500/20 bg-background p-5 transition-colors hover:bg-cyan-500/5">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-500">
              <Play size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Benchmark Success Rate</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{formatPercent(benchmarkSuccessRate)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-emerald-500/20 bg-background p-5 transition-colors hover:bg-emerald-500/5">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Server size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Platform Utilization</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{formatPercent(utilization)}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${utilization}%` }} />
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-[24px] border border-violet-500/20 bg-background p-5 transition-colors hover:bg-violet-500/5">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
              <Video size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Replay Generation Rate</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{formatPercent(benchmarkSuccessRate)}</p>
                <span className="text-[10px] text-muted-foreground">Matches Benchmarks</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.section>
  );
}
