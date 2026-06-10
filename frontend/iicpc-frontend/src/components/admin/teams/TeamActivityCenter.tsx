import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, ArrowUpCircle, UploadCloud } from 'lucide-react';
import type { ActivityEvent } from '@/hooks/useLeaderboardLiveState';

interface TeamActivityCenterProps {
  activityFeed: ActivityEvent[];
}

export function TeamActivityCenter({ activityFeed }: TeamActivityCenterProps) {
  // Filter or augment events specifically for Team management context
  // In a real environment, we'd also pull from team-specific websockets.
  const filteredFeed = activityFeed.slice(0, 15);

  if (filteredFeed.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Team Activity Center</h2>
        <p className="text-sm text-muted-foreground">Recent events and operational activity across all participating teams.</p>
      </div>

      <div className="rounded-[24px] border border-blue-500/20 bg-background p-6">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {filteredFeed.map((event) => {
              const isNewTeam = event.type === 'New Leaderboard Entry';
              const isUpload = event.details.includes('Upload') || event.type === 'New Leaderboard Entry'; // proxy
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, height: 0, x: -20 }}
                  animate={{ opacity: 1, height: 'auto', x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${isNewTeam ? 'bg-teal-500/10 text-teal-500' : event.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {isNewTeam ? <PlusCircle size={20} /> : event.type === 'Rank Improved' ? <ArrowUpCircle size={20} /> : <UploadCloud size={20} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{event.teamName} <span className="font-normal text-muted-foreground">— {event.type}</span></p>
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
