import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, CheckCircle2, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import type { LiveLeaderboardEntry } from '@/hooks/useLeaderboardLiveState';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface AdminLeaderboardDirectoryProps {
  entries: LiveLeaderboardEntry[];
}

export function AdminLeaderboardDirectory({ entries }: AdminLeaderboardDirectoryProps) {
  
  const getLanguage = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('go')) return 'Go';
    if (n.includes('rust')) return 'Rust';
    if (n.includes('java')) return 'Java';
    if (n.includes('cpp') || n.includes('c++')) return 'C++';
    if (n.includes('python')) return 'Python';
    return 'Unknown';
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Admin Leaderboard Directory</h2>
        <p className="text-sm text-muted-foreground">Comprehensive and authoritative view of all team rankings and granular performance data.</p>
      </div>

      <Card className="border-amber-500/20">
        <div className="overflow-x-auto overflow-y-hidden rounded-[24px] border border-border bg-background max-h-[800px]">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/90 text-muted-foreground sticky top-0 z-20 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 font-medium border-b border-border">Rank</th>
                <th className="px-6 py-4 font-medium border-b border-border">Team Info</th>
                <th className="px-6 py-4 font-medium border-b border-border">Language</th>
                <th className="px-6 py-4 font-medium border-b border-border">Score</th>
                <th className="px-6 py-4 font-medium border-b border-border">TPS</th>
                <th className="px-6 py-4 font-medium border-b border-border">P99 Latency</th>
                <th className="px-6 py-4 font-medium border-b border-border">Correctness</th>
                <th className="px-6 py-4 font-medium border-b border-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="relative">
              <AnimatePresence>
                {entries.map((entry, index) => {
                  const lang = getLanguage(entry.submissionName);
                  const isNew = entry.rankChange === 'new';
                  const movedUp = typeof entry.rankChange === 'number' && entry.rankChange > 0;
                  const movedDown = typeof entry.rankChange === 'number' && entry.rankChange < 0;
                  
                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={entry.id} 
                      className={`group border-b border-border transition-colors hover:bg-amber-500/5 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                    >
                      <td className="px-6 py-4 font-bold text-lg">
                        <div className="flex items-center gap-3">
                          <span className={index < 3 ? 'text-amber-500' : 'text-foreground'}>#{entry.rank}</span>
                          {isNew && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1"><Sparkles size={10} className="mr-1"/> NEW</Badge>}
                          {movedUp && <span className="flex items-center text-xs font-bold text-emerald-500"><TrendingUp size={12} className="mr-0.5"/> {entry.rankChange}</span>}
                          {movedDown && <span className="flex items-center text-xs font-bold text-rose-500"><TrendingDown size={12} className="mr-0.5"/> {Math.abs(entry.rankChange as number)}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground transition-colors group-hover:text-amber-400">{entry.teamName}</p>
                        <div className="mt-1 text-xs text-muted-foreground font-mono truncate max-w-[150px]">{entry.submissionName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={lang !== 'Unknown' ? 'default' : 'secondary'} className="text-[10px] h-5 py-0 px-2">{lang}</Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-amber-500">{formatNumber(entry.finalScore)}</td>
                      <td className="px-6 py-4 font-mono text-foreground">{formatNumber(entry.tps)}</td>
                      <td className="px-6 py-4 font-mono text-foreground">{entry.p99.toFixed(0)} ms</td>
                      <td className="px-6 py-4 font-mono">
                        <span className={entry.successRate >= 99.5 ? 'text-emerald-400' : 'text-rose-400'}>
                          {formatPercent(entry.successRate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-500 transition-all hover:bg-amber-500/20"
                        >
                          Details <ExternalLink size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {entries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No ranked submissions found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.section>
  );
}
