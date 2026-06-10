import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { LeaderboardEntry } from '@/types/api';

interface CompetitionSubmissionAnalyticsProps {
  entries: LeaderboardEntry[];
}

export function CompetitionSubmissionAnalytics({ entries }: CompetitionSubmissionAnalyticsProps) {
  
  const scoreData = useMemo(() => {
    if (entries.length === 0) return [];
    const buckets = [0, 2000, 4000, 6000, 8000, 10000];
    const result = buckets.map((b, i) => ({ 
      name: i === buckets.length - 1 ? `${b}+` : `${b}-${buckets[i+1]}`, 
      count: 0 
    }));
    entries.forEach(e => {
      let idx = buckets.findIndex((b, i) => i === buckets.length - 1 ? e.finalScore >= b : (e.finalScore >= b && e.finalScore < buckets[i+1]));
      if (idx === -1) idx = 0;
      result[idx].count++;
    });
    return result;
  }, [entries]);

  const correctnessData = useMemo(() => {
    if (entries.length === 0) return [];
    // Correctness buckets: <90, 90-95, 95-99, 99-99.9, 100
    const result = [
      { name: '<90%', count: 0 },
      { name: '90-95%', count: 0 },
      { name: '95-99%', count: 0 },
      { name: '99-99.9%', count: 0 },
      { name: '100%', count: 0 },
    ];
    entries.forEach(e => {
      if (e.successRate < 90) result[0].count++;
      else if (e.successRate < 95) result[1].count++;
      else if (e.successRate < 99) result[2].count++;
      else if (e.successRate < 100) result[3].count++;
      else result[4].count++;
    });
    return result;
  }, [entries]);

  if (entries.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-indigo-500/20 bg-background/95 p-3 shadow-xl backdrop-blur-sm">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="text-sm font-bold text-indigo-400">{payload[0].value} Submissions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Competition Submission Analytics</h2>
        <p className="text-sm text-muted-foreground">High-level distribution of submission final scores and correctness metrics.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[24px] border border-indigo-500/20 bg-gradient-to-br from-indigo-950/5 to-background p-6">
          <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-indigo-500">Submissions by Score Range</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#6366f1" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip cursor={{ fill: '#6366f1', opacity: 0.05 }} content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[24px] border border-violet-500/20 bg-gradient-to-br from-violet-950/5 to-background p-6">
          <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-violet-500">Submissions by Correctness</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correctnessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8b5cf6" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip cursor={{ fill: '#8b5cf6', opacity: 0.05 }} content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
