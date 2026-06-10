import { Inbox, Activity, CheckCircle2, ShieldCheck, Server, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SubmissionsTopStatusBarProps {
  totalSubmissions: number;
  runningPipelines: number;
  completedBenchmarks: number;
  failedSubmissions: number;
}

export function SubmissionsTopStatusBar({ totalSubmissions, runningPipelines, completedBenchmarks, failedSubmissions }: SubmissionsTopStatusBarProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-4 border-b border-border bg-slate-100 dark:bg-slate-900/50 px-6 py-2 text-xs font-medium"
    >
      <div className="flex items-center gap-1.5 text-emerald-500">
        <Inbox size={12} className="animate-pulse" />
        <span className="uppercase tracking-wider">Accepting Submissions</span>
      </div>
      
      <div className="h-3 w-px bg-border" />
      
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Activity size={12} className="text-orange-500" />
        <span>Total Processed: <span className="text-foreground">{totalSubmissions}</span></span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Activity size={12} className="text-blue-500" />
        <span>In Flight: <span className="text-foreground">{runningPipelines}</span></span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <CheckCircle2 size={12} className="text-emerald-500" />
        <span>Completed: <span className="text-foreground">{completedBenchmarks}</span></span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <XCircle size={12} className="text-rose-500" />
        <span>Failed: <span className="text-foreground">{failedSubmissions}</span></span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <ShieldCheck size={12} />
        <span>Ingress Router: <span className="text-emerald-500">Online</span></span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Server size={12} />
        <span>Storage: <span className="text-emerald-500">Available</span></span>
      </div>
      
      <div className="h-3 w-px bg-border" />
      
      <div className="text-muted-foreground">
        v2.4.1-stable
      </div>
    </motion.div>
  );
}
