import { Trophy, Activity, Zap } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';
import { formatNumber } from '@/utils/formatters';
import { motion } from 'framer-motion';

interface LeaderboardHeroProps {
  topEntry: LeaderboardEntry | undefined;
  totalCompetitors: number;
}

export function LeaderboardHero({ topEntry, totalCompetitors }: LeaderboardHeroProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[32px] border border-amber-500/20 bg-gradient-to-br from-amber-950 via-orange-950 to-background p-8 lg:p-12"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-500/20 blur-[128px]"></div>

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            </span>
            Live Competition
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Leaderboard</span>
          </h1>
          <p className="mt-4 text-lg text-amber-100/70">
            Compete against the strongest trading engines and climb the rankings through correctness, throughput, concurrency, and latency optimization.
          </p>
        </div>

        {topEntry && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/20 text-amber-400">
                  <Trophy size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-100/60">Current Leader</p>
                  <p className="text-xl font-bold text-white">{topEntry.teamName}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div>
                  <p className="text-xs text-amber-100/60">Best TPS</p>
                  <p className="font-mono text-lg font-semibold text-white">{formatNumber(topEntry.tps)}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-100/60">Success Rate</p>
                  <p className="font-mono text-lg font-semibold text-emerald-400">{topEntry.successRate.toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Navigation / Metadata */}
      <div className="relative z-10 mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 sm:grid-cols-4">
        <div>
          <p className="text-3xl font-bold text-white">{totalCompetitors}</p>
          <p className="text-sm font-medium text-amber-100/60">Total Participants</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-white">Season 1</p>
          <p className="text-sm font-medium text-amber-100/60">Current Season</p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-white">{topEntry ? formatNumber(topEntry.finalScore) : '—'}</p>
          </div>
          <p className="text-sm font-medium text-amber-100/60">Top Score</p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-white">{topEntry ? `${topEntry.p99.toFixed(0)}ms` : '—'}</p>
          </div>
          <p className="text-sm font-medium text-amber-100/60">Lowest P99</p>
        </div>
      </div>
    </motion.div>
  );
}
