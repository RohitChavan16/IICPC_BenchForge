import { Users, Activity, UserCheck, ShieldCheck, Server, Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TeamsTopStatusBarProps {
  totalTeams: number;
  activeTeams: number;
  totalMembers: number;
}

export function TeamsTopStatusBar({ totalTeams, activeTeams, totalMembers }: TeamsTopStatusBarProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-4 border-b border-border bg-slate-100 dark:bg-slate-900/50 px-6 py-2 text-xs font-medium"
    >
      <div className="flex items-center gap-1.5 text-emerald-500">
        <Globe2 size={12} className="animate-pulse" />
        <span className="uppercase tracking-wider">Registration Open</span>
      </div>
      
      <div className="h-3 w-px bg-border" />
      
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Users size={12} className="text-blue-500" />
        <span>Total Teams: <span className="text-foreground">{totalTeams}</span></span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Activity size={12} className="text-emerald-500" />
        <span>Active Teams: <span className="text-foreground">{activeTeams}</span></span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <UserCheck size={12} className="text-indigo-500" />
        <span>Total Members: <span className="text-foreground">{totalMembers}</span></span>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <ShieldCheck size={12} className="text-cyan-500" />
        <span>Auth Service: <span className="text-emerald-500">Online</span></span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Server size={12} />
        <span>Leaderboard: <span className="text-emerald-500">Live Sync</span></span>
      </div>
      
      <div className="h-3 w-px bg-border" />
      
      <div className="text-muted-foreground">
        v2.4.1-stable
      </div>
    </motion.div>
  );
}
