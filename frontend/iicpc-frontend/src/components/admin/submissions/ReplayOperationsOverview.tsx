import { motion } from 'framer-motion';
import { Video, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';
import { formatPercent } from '@/utils/formatters';

interface ReplayOperationsOverviewProps {
  entries: LeaderboardEntry[];
}

export function ReplayOperationsOverview({ entries }: ReplayOperationsOverviewProps) {
  if (!entries || entries.length === 0) return null;

  // Derive replay states based on benchmark completion (finalScore > 0 means benchmark finished)
  const total = entries.length;
  const ready = entries.filter(e => e.finalScore > 0).length;
  const processing = entries.filter(e => e.successRate >= 99.5 && e.finalScore === 0).length;
  const failed = entries.filter(e => e.successRate < 99.5).length;

  const coverageRate = total > 0 ? (ready / total) * 100 : 0;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Replay Operations Overview</h2>
        <p className="text-sm text-muted-foreground">Monitor the health and coverage of the Market Replay generation engine.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <div className="group relative overflow-hidden rounded-[24px] border border-cyan-500/20 bg-background p-5 transition-colors hover:bg-cyan-500/5 lg:col-span-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-500">
              <Video size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Coverage Rate</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-foreground">{formatPercent(coverageRate)}</p>
              </div>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${coverageRate}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:col-span-3">
          <div className="rounded-[24px] border border-emerald-500/20 bg-background p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2 text-emerald-500">
              <CheckCircle2 size={16} />
              <span className="text-xs font-semibold uppercase">Replay Ready</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{ready}</p>
          </div>

          <div className="rounded-[24px] border border-amber-500/20 bg-background p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2 text-amber-500">
              <Clock size={16} />
              <span className="text-xs font-semibold uppercase">Processing</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{processing}</p>
          </div>

          <div className="rounded-[24px] border border-rose-500/20 bg-background p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2 text-rose-500">
              <AlertCircle size={16} />
              <span className="text-xs font-semibold uppercase">Generation Failed</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{failed}</p>
          </div>
        </div>

      </div>
    </motion.section>
  );
}
