import React, { useState } from 'react';
import { SectionWrapper } from './SectionWrapper';
import { mockLiveActivityFeed } from '@/data/mockDashboardData';
import { Filter, Pause, Play, Terminal, FileText, Repeat, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LiveActivityFeed() {
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState('All');

  const types = ['All', 'System', 'Submission', 'Replay', 'Leaderboard'];

  const getIcon = (type: string) => {
    switch (type) {
      case 'System': return <Terminal size={14} className="text-cyan-500" />;
      case 'Submission': return <FileText size={14} className="text-emerald-500" />;
      case 'Replay': return <Repeat size={14} className="text-purple-500" />;
      case 'Leaderboard': return <Trophy size={14} className="text-amber-500" />;
      default: return <Terminal size={14} />;
    }
  };

  const filteredFeed = filter === 'All' ? mockLiveActivityFeed : mockLiveActivityFeed.filter(item => item.type === filter);

  const actions = (
    <div className="flex gap-2">
      <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              filter === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <button 
        onClick={() => setIsPaused(!isPaused)}
        className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title={isPaused ? "Resume Feed" : "Pause Feed"}
      >
        {isPaused ? <Play size={16} /> : <Pause size={16} />}
      </button>
    </div>
  );

  return (
    <SectionWrapper 
      title="Live Activity Feed" 
      description="Continuous stream of platform events."
      badgeLabel={isPaused ? "Paused" : "Live Stream"}
      badgeVariant={isPaused ? "warning" : "success"}
      actions={actions}
      className="mb-8"
    >
      <div className="h-64 overflow-y-auto pr-4 space-y-3 relative">
        {filteredFeed.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No events found for {filter}.
          </div>
        ) : (
          <AnimatePresence>
            {filteredFeed.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="p-2 rounded-full bg-background border border-border shrink-0 shadow-sm">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-foreground">{item.type}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                  </div>
                  <p className="text-sm text-foreground/80 truncate">{item.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </SectionWrapper>
  );
}
