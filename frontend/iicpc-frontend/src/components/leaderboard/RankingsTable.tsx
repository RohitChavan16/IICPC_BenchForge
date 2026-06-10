import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowUp, ArrowDown, Sparkles, Search } from 'lucide-react';
import type { LeaderboardLiveStateEntry, RankMovement } from '@/hooks/useLeaderboardLiveState';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const sortOptions = [
  { key: 'rank', label: 'Rank' },
  { key: 'finalScore', label: 'Score' },
  { key: 'tps', label: 'TPS' },
  { key: 'successRate', label: 'Success rate' },
  { key: 'p99', label: 'Latency p99' },
] as const;

type SortKey = (typeof sortOptions)[number]['key'];

interface RankingsTableProps {
  entries: LeaderboardLiveStateEntry[];
  filter: string;
  setFilter: (f: string) => void;
  sortKey: SortKey;
  setSortKey: (k: SortKey) => void;
}

function MovementBadge({ movement, delta }: { movement: RankMovement; delta: number }) {
  if (movement === 'new') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-blue-500/20 px-1.5 py-0.5 text-xs font-bold text-blue-400">
        <Sparkles size={12} /> NEW
      </span>
    );
  }
  if (movement === 'up') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
        <ArrowUp size={12} /> {Math.abs(delta)}
      </span>
    );
  }
  if (movement === 'down') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
        <ArrowDown size={12} /> {Math.abs(delta)}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">-</span>;
}

export function RankingsTable({ entries, filter, setFilter, sortKey, setSortKey }: RankingsTableProps) {
  
  const filteredEntries = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return entries
      .filter((entry) => {
        if (!query) return true;
        return (
          entry.teamName.toLowerCase().includes(query) ||
          entry.submissionName.toLowerCase().includes(query) ||
          entry.benchmarkId.toLowerCase().includes(query)
        );
      })
      .sort((left, right) => {
        if (sortKey === 'rank') return left.rank - right.rank;
        if (sortKey === 'finalScore') return right.finalScore - left.finalScore;
        if (sortKey === 'tps') return right.tps - left.tps;
        if (sortKey === 'successRate') return right.successRate - left.successRate;
        return left.p99 - right.p99;
      });
  }, [filter, entries, sortKey]);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Global Rankings</h2>
        <p className="text-sm text-muted-foreground">Full ranking from benchmark runs, updated live with rank movement.</p>
      </div>

      <Card className="border-indigo-500/20">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="info" className="animate-pulse bg-indigo-500/20 text-indigo-400 border-indigo-500/30">Live</Badge>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground0" />
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Search team, submission..."
                className="w-full rounded-3xl border border-border bg-background py-2.5 pl-11 pr-4 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:w-80"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Sort by:</span>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="ml-3 bg-transparent text-sm text-foreground outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.key} value={option.key} className="bg-background text-foreground">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-hidden rounded-[24px] border border-border bg-background">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Rank</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Movement</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Team / Submission</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Score</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">TPS</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">Success</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium backdrop-blur-md">P99</th>
                <th className="sticky top-0 z-10 px-6 py-4 font-medium text-right backdrop-blur-md">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredEntries.map((entry, index) => (
                  <motion.tr 
                    layoutId={`table-row-${entry.teamName}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={entry.teamName} 
                    className={`group border-t border-border transition-colors hover:bg-indigo-500/5 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                  >
                    <td className="px-6 py-4 text-foreground font-semibold">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <MovementBadge movement={entry.movement} delta={entry.rankDelta} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground transition-colors group-hover:text-indigo-400">{entry.teamName}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{entry.submissionName}</span>
                        {/* Attempt to derive language or just show a badge */}
                        {entry.submissionName.toLowerCase().includes('go') && <Badge variant="default" className="text-[10px] h-4 py-0 px-1">Go</Badge>}
                        {entry.submissionName.toLowerCase().includes('rust') && <Badge variant="default" className="text-[10px] h-4 py-0 px-1">Rust</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">{formatNumber(entry.finalScore)}</td>
                    <td className="px-6 py-4 font-mono text-foreground">{formatNumber(entry.tps)}</td>
                    <td className="px-6 py-4 font-mono text-emerald-400">{formatPercent(entry.successRate)}</td>
                    <td className="px-6 py-4 font-mono text-foreground">{entry.p99.toFixed(0)} ms</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/leaderboard/${entry.teamName}`}
                        className="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400 transition-all hover:bg-indigo-500/20"
                      >
                        Analytics <ChevronRight size={14} />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No matching competitors found.
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
