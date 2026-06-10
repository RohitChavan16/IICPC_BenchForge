import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Code2, Target, Zap, Clock, ShieldCheck } from 'lucide-react';
import type { LiveLeaderboardEntry } from '@/hooks/useLeaderboardLiveState';
import { formatNumber, formatPercent } from '@/utils/formatters';

interface LanguagePerformanceAnalyticsProps {
  entries: LiveLeaderboardEntry[];
}

export function LanguagePerformanceAnalytics({ entries }: LanguagePerformanceAnalyticsProps) {
  
  const languageStats = useMemo(() => {
    if (entries.length === 0) return null;

    const stats: Record<string, { count: number, totalScore: number, totalTps: number, totalSuccess: number, totalP99: number }> = {
      'Go': { count: 0, totalScore: 0, totalTps: 0, totalSuccess: 0, totalP99: 0 },
      'Rust': { count: 0, totalScore: 0, totalTps: 0, totalSuccess: 0, totalP99: 0 },
      'C++': { count: 0, totalScore: 0, totalTps: 0, totalSuccess: 0, totalP99: 0 },
    };

    let hasData = false;

    entries.forEach(e => {
      const n = e.submissionName.toLowerCase();
      let lang = '';
      if (n.includes('go')) lang = 'Go';
      else if (n.includes('rust')) lang = 'Rust';
      else if (n.includes('cpp') || n.includes('c++')) lang = 'C++';
      
      if (lang) {
        stats[lang].count++;
        stats[lang].totalScore += e.finalScore;
        stats[lang].totalTps += e.tps;
        stats[lang].totalSuccess += e.successRate;
        if (e.p99 > 0) stats[lang].totalP99 += e.p99;
        hasData = true;
      }
    });

    if (!hasData) return null;

    return Object.entries(stats).filter(([_, data]) => data.count > 0).map(([lang, data]) => ({
      language: lang,
      count: data.count,
      avgScore: data.totalScore / data.count,
      avgTps: data.totalTps / data.count,
      avgSuccess: data.totalSuccess / data.count,
      avgP99: data.totalP99 / data.count,
    }));

  }, [entries]);

  if (!languageStats || languageStats.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Language Performance Analytics</h2>
        <p className="text-sm text-muted-foreground">Comparative performance metrics across primary submission languages.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {languageStats.map((stat, idx) => (
          <div key={idx} className="rounded-[24px] border border-blue-500/20 bg-gradient-to-br from-blue-950/10 to-background p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Code2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{stat.language}</h3>
                  <p className="text-xs text-muted-foreground">{stat.count} Submissions</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Target size={14} className="text-amber-500"/> Avg Score</span>
                <span className="font-bold text-foreground">{formatNumber(stat.avgScore)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Zap size={14} className="text-cyan-500"/> Avg TPS</span>
                <span className="font-mono text-foreground">{formatNumber(stat.avgTps)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Clock size={14} className="text-indigo-500"/> Avg P99</span>
                <span className="font-mono text-foreground">{stat.avgP99.toFixed(0)} ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck size={14} className="text-emerald-500"/> Avg Correctness</span>
                <span className="font-mono text-emerald-400">{formatPercent(stat.avgSuccess)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
