import { Trophy, Activity, CheckCircle2, ShieldCheck, Server, Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardTopStatusBarProps {
  rankedTeams: number;
  activeCompetitors: number;
}

export function LeaderboardTopStatusBar({ rankedTeams, activeCompetitors }: LeaderboardTopStatusBarProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-4 border-b border-border bg-slate-100 dark:bg-slate-900/50 px-6 py-2 text-xs font-medium"
    >
      <div className="flex items-center gap-1.5 text-emerald-500">
        <Trophy size={12} className="animate-pulse" />
        <span className="uppercase tracking-wider">Leaderboard Live</span>
      </div>
      
      <div className="h-3 w-px bg-border" />
      
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Globe2 size={12} className="text-amber-500" />
        <span>Ranked Teams: <span className="text-foreground">{rankedTeams}</span></span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Activity size={12} className="text-emerald-500" />
        <span>Active Competitors: <span className="text-foreground">{activeCompetitors}</span></span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <ShieldCheck size={12} />
        <span>Scoring Engine: <span className="text-emerald-500">Online</span></span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Server size={12} />
        <span>Sync Service: <span className="text-emerald-500">Connected</span></span>
      </div>
      
      <div className="h-3 w-px bg-border" />
      
      <div className="text-muted-foreground">
        v2.4.1-stable
      </div>
    </motion.div>
  );
}
