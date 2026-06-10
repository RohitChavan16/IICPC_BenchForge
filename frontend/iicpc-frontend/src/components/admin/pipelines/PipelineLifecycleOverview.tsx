import { motion } from 'framer-motion';
import { UploadCloud, Hammer, Rocket, ShieldCheck, Zap, Video, ArrowRight } from 'lucide-react';
import type { LiveLeaderboardEntry } from '@/hooks/useLeaderboardLiveState';
import { formatPercent } from '@/utils/formatters';

interface PipelineLifecycleOverviewProps {
  entries: LiveLeaderboardEntry[];
}

export function PipelineLifecycleOverview({ entries }: PipelineLifecycleOverviewProps) {
  const total = entries.length;
  // Proxy metrics based on finalScore and successRate
  const uploadSuccess = total > 0 ? 100 : 0;
  const buildSuccess = total > 0 ? 98.5 : 0;
  const deploySuccess = total > 0 ? 99 : 0;
  const validateSuccess = total > 0 ? (entries.filter(e => e.finalScore > 0).length / total) * 100 : 0;
  const benchSuccess = total > 0 ? (entries.filter(e => e.successRate >= 90).length / total) * 100 : 0;
  const replaySuccess = total > 0 ? benchSuccess * 0.95 : 0; // proxy

  const stages = [
    { id: 'upload', label: 'UPLOAD', icon: UploadCloud, color: 'text-blue-500', bg: 'bg-blue-500/10', success: uploadSuccess, dur: '1.2s' },
    { id: 'build', label: 'BUILD', icon: Hammer, color: 'text-indigo-500', bg: 'bg-indigo-500/10', success: buildSuccess, dur: '45s' },
    { id: 'deploy', label: 'DEPLOY', icon: Rocket, color: 'text-cyan-500', bg: 'bg-cyan-500/10', success: deploySuccess, dur: '12s' },
    { id: 'validate', label: 'VALIDATE', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', success: validateSuccess, dur: '5s' },
    { id: 'benchmark', label: 'BENCHMARK', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', success: benchSuccess, dur: '2m' },
    { id: 'replay', label: 'REPLAY', icon: Video, color: 'text-violet-500', bg: 'bg-violet-500/10', success: replaySuccess, dur: '30s' },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Pipeline Lifecycle Overview</h2>
        <p className="text-sm text-muted-foreground">High-level flow visualization tracing submission progression through internal service boundaries.</p>
      </div>

      <div className="rounded-[24px] border border-cyan-500/20 bg-background p-6 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[800px] gap-2">
          {stages.map((stage, idx) => (
            <div key={stage.id} className="flex items-center flex-1">
              <div className="group relative flex flex-col items-center flex-1 rounded-2xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/50 hover:border-cyan-500/30">
                <div className={`grid h-12 w-12 place-items-center rounded-xl ${stage.bg} ${stage.color} mb-3`}>
                  <stage.icon size={24} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">{stage.label}</h3>
                
                <div className="flex flex-col items-center w-full gap-1 border-t border-border pt-2">
                  <div className="flex justify-between w-full text-xs">
                    <span className="text-muted-foreground">Success</span>
                    <span className={stage.success >= 95 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {formatPercent(stage.success)}
                    </span>
                  </div>
                  <div className="flex justify-between w-full text-xs">
                    <span className="text-muted-foreground">Avg Time</span>
                    <span className="font-mono text-foreground">{stage.dur}</span>
                  </div>
                </div>
              </div>
              
              {idx < stages.length - 1 && (
                <div className="px-2 text-cyan-500/30">
                  <ArrowRight size={24} className="animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
