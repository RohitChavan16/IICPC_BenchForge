import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Users, Activity, Target, Zap, ShieldCheck, Clock } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';
import { formatNumber } from '@/utils/formatters';

interface AnimatedNumberProps {
  value: number;
  format?: (val: number) => string;
}

function AnimatedNumber({ value, format = (v) => v.toFixed(0) }: AnimatedNumberProps) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => format(current));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

interface CompetitionSummaryProps {
  entries: LeaderboardEntry[];
}

export function CompetitionSummary({ entries }: CompetitionSummaryProps) {
  if (entries.length === 0) return null;

  const totalCompetitors = entries.length;
  const highestScore = Math.max(...entries.map((e) => e.finalScore));
  const avgTps = entries.reduce((acc, e) => acc + e.tps, 0) / totalCompetitors;
  const lowestP99 = Math.min(...entries.map((e) => e.p99));
  const perfectCorrectnessCount = entries.filter((e) => e.successRate >= 99.9).length;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Competition Summary</h2>
        <p className="text-sm text-muted-foreground">Executive overview of the current benchmarking landscape.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <div className="group relative overflow-hidden rounded-[24px] border border-blue-500/20 bg-background p-6 transition-colors hover:bg-blue-500/5">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-[32px] transition-all group-hover:bg-blue-500/20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-500/10 text-blue-500">
              <Users size={20} />
            </div>
          </div>
          <div className="relative z-10 mt-4">
            <p className="text-sm font-medium text-muted-foreground">Total Competitors</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              <AnimatedNumber value={totalCompetitors} />
            </p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-blue-500/20 bg-background p-6 transition-colors hover:bg-blue-500/5">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-[32px] transition-all group-hover:bg-blue-500/20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-500/10 text-blue-500">
              <Target size={20} />
            </div>
          </div>
          <div className="relative z-10 mt-4">
            <p className="text-sm font-medium text-muted-foreground">Highest Score</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              <AnimatedNumber value={highestScore} format={(v) => formatNumber(Math.round(v))} />
            </p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-blue-500/20 bg-background p-6 transition-colors hover:bg-blue-500/5">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-[32px] transition-all group-hover:bg-blue-500/20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-500/10 text-blue-500">
              <Zap size={20} />
            </div>
          </div>
          <div className="relative z-10 mt-4">
            <p className="text-sm font-medium text-muted-foreground">Average TPS</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              <AnimatedNumber value={avgTps} format={(v) => formatNumber(Math.round(v))} />
            </p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-blue-500/20 bg-background p-6 transition-colors hover:bg-blue-500/5">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-[32px] transition-all group-hover:bg-blue-500/20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-500/10 text-blue-500">
              <Clock size={20} />
            </div>
          </div>
          <div className="relative z-10 mt-4">
            <p className="text-sm font-medium text-muted-foreground">Lowest P99</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              <AnimatedNumber value={lowestP99} format={(v) => `${Math.round(v)}ms`} />
            </p>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-blue-500/20 bg-background p-6 transition-colors hover:bg-blue-500/5">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-[32px] transition-all group-hover:bg-blue-500/20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="relative z-10 mt-4">
            <p className="text-sm font-medium text-muted-foreground">Perfect Runs</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              <AnimatedNumber value={perfectCorrectnessCount} />
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
