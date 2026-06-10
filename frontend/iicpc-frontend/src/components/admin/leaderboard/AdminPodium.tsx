import { motion } from 'framer-motion';
import { Trophy, Zap, ShieldCheck } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';
import { formatNumber, formatPercent } from '@/utils/formatters';

interface AdminPodiumProps {
  entries: LeaderboardEntry[];
}

export function AdminPodium({ entries }: AdminPodiumProps) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  const podiumOrder = [
    { rank: 2, entry: top3[1], color: 'slate', gradient: 'from-slate-400 to-slate-600', border: 'border-slate-400/50', shadow: 'shadow-slate-500/20', height: 'h-64' },
    { rank: 1, entry: top3[0], color: 'amber', gradient: 'from-amber-300 to-amber-600', border: 'border-amber-400/50', shadow: 'shadow-amber-500/40', height: 'h-72' },
    { rank: 3, entry: top3[2], color: 'orange', gradient: 'from-orange-700 to-orange-900', border: 'border-orange-700/50', shadow: 'shadow-orange-900/20', height: 'h-56' },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Podium of Champions</h2>
        <p className="text-sm text-muted-foreground">Current top-ranked competitors commanding the leaderboard.</p>
      </div>

      <div className="flex flex-col items-end justify-center gap-4 sm:flex-row sm:gap-6 lg:gap-8 pt-8">
        {podiumOrder.map((spot) => {
          if (!spot.entry) return <div key={spot.rank} className="flex-1 max-w-[300px]" />;

          return (
            <motion.div
              layout
              key={spot.entry.id}
              className={`relative flex w-full flex-1 max-w-[300px] flex-col rounded-t-[32px] border-t border-l border-r ${spot.border} bg-gradient-to-b from-background to-muted/20 p-6 shadow-2xl ${spot.shadow} ${spot.height}`}
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${spot.gradient} shadow-lg ring-4 ring-background`}>
                  {spot.rank === 1 ? <Trophy size={28} className="text-black" /> : <span className="text-2xl font-bold text-white">{spot.rank}</span>}
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center text-center">
                <h3 className="text-lg font-bold text-foreground line-clamp-1">{spot.entry.teamName}</h3>
                <p className="text-xs text-muted-foreground font-mono mt-1 truncate max-w-[150px]">{spot.entry.submissionName}</p>
                
                <div className={`mt-4 rounded-full bg-gradient-to-r ${spot.gradient} px-4 py-1.5`}>
                  <p className="text-xl font-black text-black">{formatNumber(spot.entry.finalScore)}</p>
                </div>

                <div className="mt-6 flex w-full justify-between rounded-xl bg-black/20 p-3 backdrop-blur-sm">
                  <div className="flex flex-col items-center">
                    <Zap size={14} className={`text-${spot.color}-400 mb-1`} />
                    <span className="text-xs font-mono font-bold">{formatNumber(spot.entry.tps)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ShieldCheck size={14} className={`text-${spot.color}-400 mb-1`} />
                    <span className="text-xs font-mono font-bold">{formatPercent(spot.entry.successRate)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
