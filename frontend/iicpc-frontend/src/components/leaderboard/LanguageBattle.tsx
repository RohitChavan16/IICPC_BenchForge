import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Code2, Zap, ShieldCheck } from 'lucide-react';
import type { LeaderboardLiveStateEntry } from '@/hooks/useLeaderboardLiveState';
import { formatNumber, formatPercent } from '@/utils/formatters';

interface LanguageBattleProps {
  entries: LeaderboardLiveStateEntry[];
}

interface LanguageStats {
  language: string;
  count: number;
  avgScore: number;
  avgTps: number;
  avgP99: number;
  avgSuccess: number;
}

export function LanguageBattle({ entries }: LanguageBattleProps) {
  const languageStats = useMemo(() => {
    if (entries.length === 0) return null;

    const statsMap = new Map<string, { count: number; score: number; tps: number; p99: number; success: number }>();

    entries.forEach(entry => {
      // Attempt to resolve language from submissionName
      const name = entry.submissionName.toLowerCase();
      let lang = 'Unknown';
      if (name.includes('go') || name.includes('golang')) lang = 'Go';
      else if (name.includes('rust') || name.includes('rs')) lang = 'Rust';
      else if (name.includes('c++') || name.includes('cpp')) lang = 'C++';
      else if (name.includes('python') || name.includes('py')) lang = 'Python';
      else if (name.includes('node') || name.includes('js') || name.includes('ts')) lang = 'Node.js';
      else if (name.includes('java')) lang = 'Java';

      if (lang !== 'Unknown') {
        const current = statsMap.get(lang) || { count: 0, score: 0, tps: 0, p99: 0, success: 0 };
        statsMap.set(lang, {
          count: current.count + 1,
          score: current.score + entry.finalScore,
          tps: current.tps + entry.tps,
          p99: current.p99 + entry.p99,
          success: current.success + entry.successRate,
        });
      }
    });

    if (statsMap.size === 0) return null;

    const result: LanguageStats[] = [];
    statsMap.forEach((val, key) => {
      result.push({
        language: key,
        count: val.count,
        avgScore: val.score / val.count,
        avgTps: val.tps / val.count,
        avgP99: val.p99 / val.count,
        avgSuccess: val.success / val.count,
      });
    });

    return result.sort((a, b) => b.avgScore - a.avgScore);
  }, [entries]);

  if (!languageStats || languageStats.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Language Battle</h2>
        <p className="text-sm text-muted-foreground">Comparative performance metrics across different programming languages.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {languageStats.map((stat, idx) => (
          <div key={stat.language} className="group relative overflow-hidden rounded-[24px] border border-rose-500/20 bg-gradient-to-br from-rose-950/5 to-background p-6 transition-colors hover:bg-rose-500/5">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-500/10 blur-[32px]"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-500">
                  <Code2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{stat.language}</h3>
                  <p className="text-xs text-muted-foreground">{stat.count} submission{stat.count > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Rank #{idx + 1}</p>
              </div>
            </div>
            
            <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 border-t border-rose-500/10 pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <p className="font-mono text-sm font-bold text-foreground">{formatNumber(stat.avgScore)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg TPS</p>
                <p className="font-mono text-sm font-bold text-foreground">{formatNumber(stat.avgTps)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg P99</p>
                <p className="font-mono text-sm font-bold text-foreground">{stat.avgP99.toFixed(0)} ms</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Correctness</p>
                <p className="font-mono text-sm font-bold text-emerald-400">{formatPercent(stat.avgSuccess)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
