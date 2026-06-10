import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, CheckCircle2, ShieldAlert, Rocket, RefreshCw } from 'lucide-react';
import type { ActivityEvent } from '@/hooks/useLeaderboardLiveState';

interface LivePipelineFeedProps {
  activityFeed: ActivityEvent[];
}

export function LivePipelineFeed({ activityFeed }: LivePipelineFeedProps) {
  if (!activityFeed || activityFeed.length === 0) return null;

  const displayFeed = activityFeed.slice(0, 10);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Live Pipeline Feed</h2>
        <p className="text-sm text-muted-foreground">Real-time execution log of state transitions and workflow events.</p>
      </div>

      <div className="rounded-[24px] border border-cyan-500/20 bg-background p-6">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {displayFeed.map((event) => {
              const isNewEntry = event.type === 'New Leaderboard Entry';
              const isRankUp = event.type === 'Rank Improved';
              const isDrop = event.type === 'Rank Dropped';
              
              let icon = <Rocket size={16} />;
              let color = 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
              let stage = 'DEPLOY';
              
              if (isNewEntry) {
                icon = <CheckCircle2 size={16} />;
                color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                stage = 'VALIDATE';
              } else if (isRankUp) {
                icon = <RefreshCw size={16} />;
                color = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
                stage = 'BENCHMARK';
              } else if (isDrop) {
                icon = <ShieldAlert size={16} />;
                color = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
                stage = 'REPLAY';
              }

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, height: 0, x: -20 }}
                  animate={{ opacity: 1, height: 'auto', x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${color}`}>
                    {icon}
                  </div>
                  <div className="w-24 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stage}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{event.teamName} <span className="font-mono font-normal text-xs text-muted-foreground ml-2">({event.submissionName})</span></p>
                    <p className="text-xs text-muted-foreground">{event.details}</p>
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
