import { Activity, Server, Cpu, Layers, PlayCircle, Video, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopStatusBarProps {
  runningPipelines: number;
  validationQueue: number;
  benchmarkQueue: number;
  replayQueue: number;
}

export function TopStatusBar({ runningPipelines, validationQueue, benchmarkQueue, replayQueue }: TopStatusBarProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-4 border-b border-border bg-slate-100 dark:bg-slate-900/50 px-6 py-2 text-xs font-medium"
    >
      <div className="flex items-center gap-1.5 text-emerald-500">
        <Activity size={12} className="animate-pulse" />
        <span className="uppercase tracking-wider">Platform Operational</span>
      </div>
      
      <div className="h-3 w-px bg-border" />
      
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Cpu size={12} className="text-cyan-500" />
        <span>Workers Active: <span className="text-foreground">24/24</span></span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Layers size={12} className="text-indigo-500" />
        <span>Running Pipelines: <span className="text-foreground">{runningPipelines}</span></span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <CheckCircle2 size={12} className="text-blue-500" />
        <span>Validation Q: <span className="text-foreground">{validationQueue}</span></span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <PlayCircle size={12} className="text-amber-500" />
        <span>Benchmark Q: <span className="text-foreground">{benchmarkQueue}</span></span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Video size={12} className="text-violet-500" />
        <span>Replay Q: <span className="text-foreground">{replayQueue}</span></span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Server size={12} />
        <span>Pipeline Service: <span className="text-emerald-500">Online</span></span>
      </div>
      
      <div className="h-3 w-px bg-border" />
      
      <div className="text-muted-foreground">
        v2.4.1-stable
      </div>
    </motion.div>
  );
}
