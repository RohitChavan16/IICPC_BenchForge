import { motion } from 'framer-motion';
import { UploadCloud, Hammer, Rocket, ShieldCheck, Zap, Video } from 'lucide-react';
import type { LiveLeaderboardEntry } from '@/hooks/useLeaderboardLiveState';
import { formatPercent } from '@/utils/formatters';

interface PipelineHealthDashboardProps {
  entries: LiveLeaderboardEntry[];
}

export function PipelineHealthDashboard({ entries }: PipelineHealthDashboardProps) {
  const total = entries.length;
  const validateSuccess = total > 0 ? (entries.filter(e => e.finalScore > 0).length / total) * 100 : 0;
  const benchSuccess = total > 0 ? (entries.filter(e => e.successRate >= 90).length / total) * 100 : 0;
  const replaySuccess = total > 0 ? benchSuccess * 0.95 : 0;

  const cards = [
    { title: 'Upload Health', success: 100, pending: 0, time: '1.2s', icon: UploadCloud, color: 'text-blue-500', border: 'border-blue-500/20' },
    { title: 'Build Health', success: 98.5, pending: 2, time: '45.0s', icon: Hammer, color: 'text-indigo-500', border: 'border-indigo-500/20' },
    { title: 'Deployment Health', success: 99.0, pending: 0, time: '12.4s', icon: Rocket, color: 'text-cyan-500', border: 'border-cyan-500/20' },
    { title: 'Validation Health', success: validateSuccess, pending: entries.filter(e => e.finalScore === 0).length, time: '5.1s', icon: ShieldCheck, color: 'text-emerald-500', border: 'border-emerald-500/20' },
    { title: 'Benchmark Health', success: benchSuccess, pending: 0, time: '120.5s', icon: Zap, color: 'text-amber-500', border: 'border-amber-500/20' },
    { title: 'Replay Health', success: replaySuccess, pending: 5, time: '30.2s', icon: Video, color: 'text-violet-500', border: 'border-violet-500/20' },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Pipeline Health Dashboard</h2>
        <p className="text-sm text-muted-foreground">Monitor success rates, throughput, latency, and processing health across every execution stage of the platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, idx) => {
          const failRate = 100 - card.success;
          return (
            <div key={idx} className={`rounded-2xl border ${card.border} bg-background p-5 hover:bg-muted/30 transition-colors`}>
              <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted ${card.color}`}>
                  <card.icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{card.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="relative flex h-2 w-2">
                      {card.success >= 95 ? (
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                      ) : (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {card.success >= 95 ? 'Healthy' : 'Degraded'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-bold text-emerald-400">{formatPercent(card.success)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Failure Rate</span>
                  <span className={failRate > 5 ? "font-bold text-rose-400" : "font-mono text-muted-foreground"}>{formatPercent(failRate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Jobs</span>
                  <span className="font-mono text-foreground">{card.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Processing Time</span>
                  <span className="font-mono text-foreground">{card.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
