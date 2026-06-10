import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';
import { formatNumber, formatPercent } from '@/utils/formatters';

interface PodiumProps {
  topEntries: LeaderboardEntry[];
}

export function Podium({ topEntries }: PodiumProps) {
  if (topEntries.length < 3) return null;

  const [gold, silver, bronze] = topEntries.slice(0, 3);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Podium of Champions</h2>
        <p className="text-sm text-muted-foreground">The three highest-performing trading engines currently leading the competition.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-center">
        
        {/* Silver */}
        <motion.div layoutId={`podium-team-${silver.teamName}`} className="relative flex-1 rounded-[24px] border border-slate-300/20 bg-gradient-to-b from-slate-200/5 to-background p-6 shadow-xl lg:order-1 lg:h-[320px]">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-slate-300/50 to-transparent"></div>
          <div className="flex flex-col h-full justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Silver / 2nd</p>
              <h3 className="mt-2 text-2xl font-bold text-foreground">{silver.teamName}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{silver.submissionName}</p>
            </div>
            <div className="mt-6 space-y-3 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Score</span>
                <span className="font-semibold text-foreground">{formatNumber(silver.finalScore)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TPS</span>
                <span className="font-mono text-foreground">{formatNumber(silver.tps)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">P99</span>
                <span className="font-mono text-foreground">{silver.p99.toFixed(0)}ms</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gold */}
        <motion.div layoutId={`podium-team-${gold.teamName}`} className="relative flex-1 rounded-[28px] border border-amber-400/30 bg-gradient-to-b from-amber-500/10 to-background p-8 shadow-2xl shadow-amber-500/10 lg:order-2 lg:h-[360px] lg:-translate-y-4">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-white shadow-lg shadow-amber-500/20">
              <Trophy size={20} />
            </div>
          </div>
          <div className="flex flex-col h-full justify-between mt-2">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Gold / 1st</p>
              <h3 className="mt-2 text-3xl font-bold text-foreground">{gold.teamName}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{gold.submissionName}</p>
            </div>
            <div className="mt-6 space-y-4 border-t border-amber-500/20 pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-amber-500/80 font-medium">Score</span>
                <span className="font-bold text-foreground text-lg">{formatNumber(gold.finalScore)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TPS</span>
                <span className="font-mono text-foreground">{formatNumber(gold.tps)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">P99</span>
                <span className="font-mono text-foreground">{gold.p99.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Correctness</span>
                <span className="font-mono text-emerald-500">{formatPercent(gold.successRate)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bronze */}
        <motion.div layoutId={`podium-team-${bronze.teamName}`} className="relative flex-1 rounded-[24px] border border-orange-700/20 bg-gradient-to-b from-orange-800/5 to-background p-6 shadow-xl lg:order-3 lg:h-[300px]">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-orange-700/50 to-transparent"></div>
          <div className="flex flex-col h-full justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-600">Bronze / 3rd</p>
              <h3 className="mt-2 text-xl font-bold text-foreground">{bronze.teamName}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{bronze.submissionName}</p>
            </div>
            <div className="mt-6 space-y-3 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Score</span>
                <span className="font-semibold text-foreground">{formatNumber(bronze.finalScore)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TPS</span>
                <span className="font-mono text-foreground">{formatNumber(bronze.tps)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">P99</span>
                <span className="font-mono text-foreground">{bronze.p99.toFixed(0)}ms</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
