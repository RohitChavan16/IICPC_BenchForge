import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowUpCircle, ArrowDownCircle, PlusCircle, MinusCircle } from 'lucide-react';
import type { ActivityEvent } from '@/hooks/useLeaderboardLiveState';
import { formatRelativeDate } from '@/utils/formatters';

interface LiveActivityFeedProps {
  activityFeed: ActivityEvent[];
}

export function LiveActivityFeed({ activityFeed }: LiveActivityFeedProps) {
  if (activityFeed.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Live Competition Activity</h2>
        <p className="text-sm text-muted-foreground">Real-time mathematically derived events based on active leaderboard snapshots.</p>
      </div>

      <div className="rounded-[24px] border border-orange-500/20 bg-background p-6">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {activityFeed.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, height: 0, x: -20 }}
                animate={{ opacity: 1, height: 'auto', x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${event.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {event.type === 'Rank Improved' && <ArrowUpCircle size={20} />}
                  {event.type === 'Rank Dropped' && <ArrowDownCircle size={20} />}
                  {event.type === 'New Leaderboard Entry' && <PlusCircle size={20} className="text-emerald-500" />}
                  {event.type === 'Leaderboard Exit' && <MinusCircle size={20} className="text-red-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{event.teamName} <span className="font-normal text-muted-foreground">— {event.type}</span></p>
                  <p className="text-xs text-muted-foreground">{event.details}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
