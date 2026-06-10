import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Star, TrendingUp, Trophy } from 'lucide-react';
import type { ActivityEvent } from '@/hooks/useLeaderboardLiveState';

interface LiveCompetitionActivityProps {
  activityFeed: ActivityEvent[];
}

export function LiveCompetitionActivity({ activityFeed }: LiveCompetitionActivityProps) {
  if (!activityFeed || activityFeed.length === 0) return null;

  const displayFeed = activityFeed.slice(0, 10); // Show recent 10 events

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Live Competition Activity</h2>
        <p className="text-sm text-muted-foreground">Real-time operational feed of ranking changes and achievements.</p>
      </div>

      <div className="rounded-[24px] border border-amber-500/20 bg-background p-6">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {displayFeed.map((event) => {
              const isNewEntry = event.type === 'New Leaderboard Entry';
              const isRankUp = event.type === 'Rank Improved';
              const isTop10 = event.details.includes('Top 10');
              
              let icon = <TrendingUp size={16} />;
              let color = 'text-amber-500 bg-amber-500/10';
              if (isNewEntry) {
                icon = <Star size={16} />;
                color = 'text-blue-500 bg-blue-500/10';
              } else if (isTop10) {
                icon = <Trophy size={16} />;
                color = 'text-orange-500 bg-orange-500/10';
              } else if (isRankUp) {
                icon = <ArrowUp size={16} />;
                color = 'text-emerald-500 bg-emerald-500/10';
              }

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, height: 0, x: -20 }}
                  animate={{ opacity: 1, height: 'auto', x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${color}`}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{event.teamName}</p>
                    <p className="text-xs text-muted-foreground">{event.type} — {event.details}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
