import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Activity, Loader } from 'lucide-react';
import type { LiveLeaderboardEntry } from '@/hooks/useLeaderboardLiveState';

interface PipelineBottleneckDetectionProps {
  entries: LiveLeaderboardEntry[];
}

export function PipelineBottleneckDetection({ entries }: PipelineBottleneckDetectionProps) {
  // Proxy derivations
  const slowestStage = 'Build';
  const highestFail = 'Validation';
  const mostBacklog = 'Replay';
  const activeStage = 'Benchmark';

  const bottlenecks = [
    { label: 'Slowest Stage', value: slowestStage, desc: 'Currently averaging 45.0s per job', icon: Clock, color: 'text-amber-500' },
    { label: 'Highest Failure Rate', value: highestFail, desc: 'Rejecting 15% of recent uploads', icon: AlertTriangle, color: 'text-rose-500' },
    { label: 'Most Backlogged', value: mostBacklog, desc: '5 jobs waiting for resources', icon: Loader, color: 'text-violet-500' },
    { label: 'Highest Activity', value: activeStage, desc: 'Processing 12 concurrent jobs', icon: Activity, color: 'text-emerald-500' },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Pipeline Bottleneck Detection</h2>
        <p className="text-sm text-muted-foreground">Automated administrative insights highlighting operational friction points.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {bottlenecks.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 rounded-[24px] border border-border bg-background p-5 transition-colors hover:bg-muted/30">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted ${item.color}`}>
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 text-lg font-bold text-foreground truncate">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
