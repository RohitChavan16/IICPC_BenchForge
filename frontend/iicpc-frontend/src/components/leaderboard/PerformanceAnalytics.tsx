import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { LeaderboardLiveStateEntry } from '@/hooks/useLeaderboardLiveState';

interface PerformanceAnalyticsProps {
  entries: LeaderboardLiveStateEntry[];
}

export function PerformanceAnalytics({ entries }: PerformanceAnalyticsProps) {
  
  const scoreData = useMemo(() => {
    if (entries.length === 0) return [];
    const buckets = [0, 2000, 4000, 6000, 8000, 10000];
    const result = buckets.map(b => ({ name: `${b}+`, count: 0 }));
    entries.forEach(e => {
      let idx = Math.floor(e.finalScore / 2000);
      if (idx > 4) idx = 4;
      result[idx].count++;
    });
    return result;
  }, [entries]);

  const tpsData = useMemo(() => {
    if (entries.length === 0) return [];
    const buckets = [0, 500, 1000, 2000, 5000, 10000];
    const result = buckets.map((b, i) => ({ 
      name: i === buckets.length - 1 ? `${b}+` : `${b}-${buckets[i+1]}`, 
      count: 0 
    }));
    entries.forEach(e => {
      let idx = buckets.findIndex((b, i) => i === buckets.length - 1 ? e.tps >= b : (e.tps >= b && e.tps < buckets[i+1]));
      if (idx === -1) idx = 0;
      result[idx].count++;
    });
    return result;
  }, [entries]);

  if (entries.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-cyan-500/20 bg-background/95 p-3 shadow-xl backdrop-blur-sm">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="text-sm font-bold text-cyan-400">{payload[0].value} Engines</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Performance Analytics</h2>
        <p className="text-sm text-muted-foreground">Distribution and comparative analysis of throughput, latency, correctness, and scoring performance.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-cyan-500/20 bg-gradient-to-br from-cyan-950/5 to-background p-6">
          <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-cyan-500">Score Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22d3ee" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip cursor={{ fill: '#22d3ee', opacity: 0.05 }} content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[24px] border border-cyan-500/20 bg-gradient-to-br from-cyan-950/5 to-background p-6">
          <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-cyan-500">TPS Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tpsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22d3ee" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip cursor={{ fill: '#22d3ee', opacity: 0.05 }} content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
