import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ExternalLink, Activity, ShieldCheck, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import type { LiveLeaderboardEntry } from '@/hooks/useLeaderboardLiveState';
import { Badge } from '@/components/ui/Badge';

interface PipelineDirectoryProps {
  entries: LiveLeaderboardEntry[];
}

export function PipelineDirectory({ entries }: PipelineDirectoryProps) {
  
  const getStageInfo = (entry: LiveLeaderboardEntry) => {
    // Infer pipeline stage
    if (entry.finalScore === 0) {
      return { stage: 'BENCHMARK', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: PlayCircle };
    }
    if (entry.successRate < 90) {
      return { stage: 'VALIDATE', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: Activity };
    }
    if (entry.successRate >= 99.5) {
      return { stage: 'REPLAY', color: 'text-violet-500', bg: 'bg-violet-500/10', icon: CheckCircle2 };
    }
    return { stage: 'DEPLOY', color: 'text-cyan-500', bg: 'bg-cyan-500/10', icon: ShieldCheck };
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Pipeline Directory</h2>
        <p className="text-sm text-muted-foreground">Comprehensive tracking of all active and historical pipeline executions.</p>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-cyan-500/20 bg-background">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm whitespace-nowrap">
          <thead className="bg-muted/90 text-muted-foreground sticky top-0 z-20 backdrop-blur-md">
            <tr>
              <th className="px-6 py-4 font-medium border-b border-border">Pipeline ID</th>
              <th className="px-6 py-4 font-medium border-b border-border">Target</th>
              <th className="px-6 py-4 font-medium border-b border-border">Current Stage</th>
              <th className="px-6 py-4 font-medium border-b border-border">Status</th>
              <th className="px-6 py-4 font-medium border-b border-border">Duration</th>
              <th className="px-6 py-4 font-medium border-b border-border">Queue Pos</th>
              <th className="px-6 py-4 font-medium border-b border-border text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="relative">
            <AnimatePresence>
              {entries.map((entry, index) => {
                const info = getStageInfo(entry);
                
                return (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={entry.id} 
                    className={`group border-b border-border transition-colors hover:bg-cyan-500/5 hover:shadow-[inset_4px_0_0_0_rgba(6,182,212,0.5)] ${index % 2 === 0 ? 'bg-background' : 'bg-muted/5'}`}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {entry.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground group-hover:text-cyan-400 transition-colors">{entry.teamName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{entry.submissionName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`grid h-6 w-6 place-items-center rounded-md ${info.bg} ${info.color}`}>
                          <info.icon size={12} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">{info.stage}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={entry.finalScore > 0 ? 'default' : 'info'} className={entry.finalScore > 0 ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20' : ''}>
                        {entry.finalScore > 0 ? 'COMPLETED' : 'RUNNING'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground flex items-center gap-1.5">
                      <Clock size={12} /> {entry.finalScore > 0 ? '2m 14s' : '0m 45s'}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {entry.finalScore === 0 ? '#1' : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <Settings size={14} />
                        </button>
                        <button className="inline-flex h-8 items-center gap-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 text-xs font-semibold text-cyan-500 transition-all hover:bg-cyan-500/20">
                          Logs <ExternalLink size={12} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
