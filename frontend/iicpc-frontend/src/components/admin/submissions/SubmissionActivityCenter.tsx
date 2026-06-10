import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, Play, FileCode, Video } from 'lucide-react';
import type { ActivityEvent } from '@/hooks/useLeaderboardLiveState';

interface SubmissionActivityCenterProps {
  activityFeed: ActivityEvent[];
}

export function SubmissionActivityCenter({ activityFeed }: SubmissionActivityCenterProps) {
  // Filter or augment events specifically for Submission context
  const filteredFeed = activityFeed.slice(0, 15);

  if (filteredFeed.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Submission Activity Center</h2>
        <p className="text-sm text-muted-foreground">Recent operational events, state transitions, and leaderboard impacts.</p>
      </div>

      <div className="rounded-[24px] border border-amber-500/20 bg-background p-6">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {filteredFeed.map((event) => {
              const isUpload = event.type === 'New Leaderboard Entry';
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, height: 0, x: -20 }}
                  animate={{ opacity: 1, height: 'auto', x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${isUpload ? 'bg-amber-500/10 text-amber-500' : event.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                    {isUpload ? <UploadCloud size={20} /> : event.type === 'Rank Improved' ? <CheckCircle2 size={20} /> : <FileCode size={20} />}
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
