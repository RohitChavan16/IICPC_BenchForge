import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Globe, CheckCircle, Activity, Zap, Clock, ShieldCheck, Hash } from 'lucide-react';
import { mockExecutiveKPIs } from '@/data/mockDashboardData';

const iconMap: Record<string, React.ReactNode> = {
  bestScore: <Trophy size={20} />,
  globalRank: <Globe size={20} />,
  benchmarksCompleted: <Hash size={20} />,
  successRate: <CheckCircle size={20} />,
  averageTPS: <Activity size={20} />,
  bestTPS: <Zap size={20} />,
  bestP99: <Clock size={20} />,
  correctness: <ShieldCheck size={20} />
};

const tintMap: Record<string, string> = {
  bestScore: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
  globalRank: 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-900/30',
  benchmarksCompleted: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
  successRate: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
  averageTPS: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/30',
  bestTPS: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
  bestP99: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
  correctness: 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/30'
};

const labelMap: Record<string, string> = {
  bestScore: 'Best Score',
  globalRank: 'Global Rank',
  benchmarksCompleted: 'Benchmarks Run',
  successRate: 'Success Rate',
  averageTPS: 'Average TPS',
  bestTPS: 'Best TPS',
  bestP99: 'Best P99 Latency',
  correctness: 'Correctness'
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export function ExecutiveKPIStrip() {
  const [data, setData] = useState<typeof mockExecutiveKPIs | null>(null);

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => setData(mockExecutiveKPIs), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[120px] rounded-2xl bg-muted/50 animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8"
    >
      {Object.entries(data).map(([key, metric]) => {
        const isPositive = metric.trend.startsWith('+');
        const isNeutral = metric.trend === '0%';
        const trendColor = isNeutral ? 'text-muted-foreground' : (isPositive ? 'text-emerald-500' : 'text-rose-500');

        return (
          <motion.div 
            key={key}
            variants={item}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`p-4 rounded-2xl border flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow cursor-default ${tintMap[key]}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-xl bg-white/50 dark:bg-black/20 shadow-sm backdrop-blur-sm">
                {iconMap[key]}
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 ${trendColor}`}>
                {metric.trend}
              </span>
            </div>
            
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold opacity-70 mb-1">
                {labelMap[key]}
              </p>
              <div className="text-2xl font-black tracking-tight">
                {metric.value}
              </div>
              <p className="text-[10px] leading-tight opacity-70 mt-2 line-clamp-2" title={metric.description}>
                {metric.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
