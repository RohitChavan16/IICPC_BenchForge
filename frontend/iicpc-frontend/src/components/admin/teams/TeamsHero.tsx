import { motion } from 'framer-motion';
import { Users, Activity, Target, Shield, Clock } from 'lucide-react';
import { formatNumber } from '@/utils/formatters';

interface TeamsHeroProps {
  totalTeams: number;
  activeTeams: number;
  totalMembers: number;
  totalSubmissions: number;
  totalBenchmarks: number;
  topTeamScore: number;
}

export function TeamsHero({ 
  totalTeams, 
  activeTeams, 
  totalMembers, 
  totalSubmissions, 
  totalBenchmarks,
  topTeamScore
}: TeamsHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden border-b border-border bg-teal-50/50 dark:bg-teal-950/10 px-6 py-12 md:px-12 lg:px-16"
    >
      <div className="relative z-10 flex flex-col gap-10 w-full max-w-7xl mx-auto">
        
        {/* Top: Title and Description */}
        <div className="max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-50 dark:bg-teal-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <Shield size={14} className="animate-pulse" />
            Administration Console
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Team Management
          </h1>
          
          <p className="mt-4 text-base font-medium text-muted-foreground leading-relaxed max-w-3xl">
            Manage participating teams, monitor competition activity, review submissions, and oversee platform participation.
          </p>
        </div>

        {/* Bottom: Operational Stats (Tags/Cards) */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 w-full">
          
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5"><Users size={14}/> Total Teams</p>
            <p className="mt-1.5 text-2xl font-black text-blue-700 dark:text-blue-300">{formatNumber(totalTeams)}</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5"><Activity size={14}/> Active Teams</p>
            <p className="mt-1.5 text-2xl font-black text-emerald-700 dark:text-emerald-300">{formatNumber(activeTeams)}</p>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5"><Users size={14}/> Members</p>
            <p className="mt-1.5 text-2xl font-black text-indigo-700 dark:text-indigo-300">{formatNumber(totalMembers)}</p>
          </div>

          <div className="rounded-xl border border-cyan-200 bg-cyan-50 dark:border-cyan-500/20 dark:bg-cyan-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5"><Clock size={14}/> Submissions</p>
            <p className="mt-1.5 text-2xl font-black text-cyan-700 dark:text-cyan-300">{formatNumber(totalSubmissions)}</p>
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5"><Activity size={14}/> Benchmarks</p>
            <p className="mt-1.5 text-2xl font-black text-violet-700 dark:text-violet-300">{formatNumber(totalBenchmarks)}</p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5 p-4 transition-colors">
            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5"><Target size={14}/> Top Score</p>
            <p className="mt-1.5 text-2xl font-black text-rose-700 dark:text-rose-300">{formatNumber(topTeamScore)}</p>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
