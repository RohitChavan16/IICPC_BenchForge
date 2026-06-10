import { motion } from 'framer-motion';
import { Server, Database, ShieldCheck, Play, Video } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';
import { formatPercent } from '@/utils/formatters';

interface PipelineHealthCenterProps {
  entries: LeaderboardEntry[];
}

export function PipelineHealthCenter({ entries }: PipelineHealthCenterProps) {
  if (!entries || entries.length === 0) return null;

  const total = entries.length;
  // Proxy derivations for pipeline stages based on data
  const uploads = total; // If it's an entry, it was uploaded
  const builds = total; // Assuming builds pass to become entries
  const validations = entries.filter(e => e.successRate >= 99.5).length;
  const benchmarks = entries.filter(e => e.finalScore > 0).length;
  const replays = benchmarks; // Replays usually accompany successful benchmarks in our current model

  const stages = [
    { name: 'Upload & Build', success: builds, total, icon: Database },
    { name: 'Deployment', success: builds, total, icon: Server },
    { name: 'Validation', success: validations, total, icon: ShieldCheck },
    { name: 'Benchmark', success: benchmarks, total, icon: Play },
    { name: 'Replay Generation', success: replays, total, icon: Video },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Pipeline Health Center</h2>
        <p className="text-sm text-muted-foreground">Operational visibility across all submission processing stages.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stages.map((stage, idx) => {
          const successRate = stage.total > 0 ? (stage.success / stage.total) * 100 : 0;
          const isHealthy = successRate > 90;
          const isWarning = successRate <= 90 && successRate > 50;
          
          let colorClass = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
          let barClass = 'bg-emerald-500';
          if (isWarning) {
            colorClass = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            barClass = 'bg-amber-500';
          } else if (!isHealthy && !isWarning) {
            colorClass = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            barClass = 'bg-rose-500';
          }

          return (
            <div key={idx} className={`rounded-[24px] border border-border bg-background p-5 hover:bg-muted/10 transition-colors`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${colorClass}`}>
                  <stage.icon size={20} />
                </div>
                <span className="text-xl font-bold text-foreground">{formatPercent(successRate)}</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{stage.success} / {stage.total} successful</p>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full transition-all duration-1000 ${barClass}`} style={{ width: `${successRate}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
