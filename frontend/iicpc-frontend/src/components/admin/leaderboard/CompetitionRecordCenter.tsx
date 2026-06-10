import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Clock, ShieldCheck, Crown } from 'lucide-react';
import type { LiveLeaderboardEntry } from '@/hooks/useLeaderboardLiveState';
import { formatNumber, formatPercent } from '@/utils/formatters';

interface CompetitionRecordCenterProps {
  entries: LiveLeaderboardEntry[];
}

export function CompetitionRecordCenter({ entries }: CompetitionRecordCenterProps) {
  if (!entries || entries.length === 0) return null;

  const highestScore = [...entries].sort((a, b) => b.finalScore - a.finalScore)[0];
  const highestTps = [...entries].sort((a, b) => b.tps - a.tps)[0];
  const lowestP99 = [...entries].filter(e => e.p99 > 0).sort((a, b) => a.p99 - b.p99)[0];
  const perfectCorrectness = [...entries].filter(e => e.successRate >= 100).sort((a, b) => b.tps - a.tps)[0];

  const records = [
    { title: 'Highest Score', metric: formatNumber(highestScore?.finalScore), team: highestScore?.teamName, icon: Trophy, color: 'text-amber-500', isNew: highestScore?.rankChange === 'new' },
    { title: 'Highest TPS', metric: formatNumber(highestTps?.tps), team: highestTps?.teamName, icon: Zap, color: 'text-cyan-500', isNew: highestTps?.rankChange === 'new' },
    { title: 'Lowest P99', metric: lowestP99 ? `${lowestP99.p99.toFixed(0)} ms` : '-', team: lowestP99?.teamName, icon: Clock, color: 'text-indigo-500', isNew: lowestP99?.rankChange === 'new' },
    { title: 'Perfect Correctness', metric: perfectCorrectness ? formatPercent(perfectCorrectness.successRate) : '-', team: perfectCorrectness?.teamName, icon: ShieldCheck, color: 'text-emerald-500', isNew: perfectCorrectness?.rankChange === 'new' },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Competition Record Center</h2>
        <p className="text-sm text-muted-foreground">The ultimate hall of fame highlighting the absolute pinnacle of platform performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {records.map((record, idx) => (
          record.team && (
            <motion.div 
              key={idx}
              layout
              className="relative overflow-hidden rounded-[24px] border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-background p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`grid h-12 w-12 place-items-center rounded-xl bg-background/50 backdrop-blur-sm border border-border ${record.color}`}>
                  <record.icon size={24} />
                </div>
                <AnimatePresence>
                  {record.isNew && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-400 border border-rose-500/30"
                    >
                      <Crown size={12} /> NEW RECORD
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{record.title}</h3>
                <p className={`mt-2 text-3xl font-black ${record.color} font-mono`}>{record.metric}</p>
                <div className="mt-4 border-t border-border/50 pt-4">
                  <p className="text-sm text-muted-foreground">Held by</p>
                  <p className="font-bold text-foreground truncate">{record.team}</p>
                </div>
              </div>
            </motion.div>
          )
        ))}
      </div>
    </motion.section>
  );
}
