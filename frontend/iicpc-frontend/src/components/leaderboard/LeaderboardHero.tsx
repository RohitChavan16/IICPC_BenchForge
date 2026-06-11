import { Trophy, Activity, Zap } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';
import type { LiveLeaderboardEntry } from '@/hooks/useLeaderboardLiveState';
import { formatNumber } from '@/utils/formatters';
import { motion } from 'framer-motion';

interface LeaderboardHeroProps {
  topEntry: LeaderboardEntry | undefined;
  userEntry: LiveLeaderboardEntry | undefined;
  totalCompetitors: number;
}

export function LeaderboardHero({ topEntry, userEntry, totalCompetitors }: LeaderboardHeroProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[32px] border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/50 p-8 lg:p-12 shadow-sm"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 invert"></div>
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-300/40 blur-[128px]"></div>

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100/50 px-4 py-1.5 text-sm text-amber-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600"></span>
            </span>
            Live Competition
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">Leaderboard</span>
          </h1>
          <p className="mt-4 text-lg text-slate-700">
            Compete against the strongest trading engines and climb the rankings through correctness, throughput, concurrency, and latency optimization.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {userEntry ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                boxShadow: [
                  "0 0 0px rgba(99, 102, 241, 0)",
                  "0 0 25px rgba(99, 102, 241, 0.4)",
                  "0 0 0px rgba(99, 102, 241, 0)"
                ]
              }}
              transition={{ 
                scale: { type: "spring", stiffness: 300, damping: 20 },
                opacity: { duration: 0.3 },
                boxShadow: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
              }}
              className="rounded-xl border border-indigo-300 bg-indigo-50/90 p-6 min-w-[280px]"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Your Current Rank</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-slate-900">#{userEntry.rank}</p>
                    {userEntry.movement === 'up' && <span className="flex items-center text-sm font-semibold text-emerald-600">▲ {Math.abs(userEntry.rankDelta)}</span>}
                    {userEntry.movement === 'down' && <span className="flex items-center text-sm font-semibold text-rose-600">▼ {Math.abs(userEntry.rankDelta)}</span>}
                    {userEntry.movement === 'new' && <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">NEW</span>}
                    {userEntry.movement === 'none' && <span className="text-sm font-medium text-slate-400">—</span>}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-indigo-200/50 pt-4">
                <div>
                  <p className="text-xs text-slate-600">Your Score</p>
                  <p className="font-mono text-lg font-semibold text-slate-900">{formatNumber(userEntry.finalScore)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Success Rate</p>
                  <p className="font-mono text-lg font-semibold text-emerald-600">{userEntry.successRate.toFixed(2)}%</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm flex flex-col justify-center max-w-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-200 text-slate-500">
                  <Zap size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-700">No Rank Yet</p>
              </div>
              <p className="text-sm text-slate-600">
                You need to submit at least one engine to display your rank.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quick Navigation / Metadata */}
      <div className="relative z-10 mt-12 grid grid-cols-2 gap-4 border-t border-amber-200/50 pt-8 sm:grid-cols-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 shadow-sm">
          <p className="text-3xl font-bold text-slate-900">{totalCompetitors}</p>
          <p className="text-sm font-medium text-slate-600">Total Participants</p>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50/80 p-4 shadow-sm">
          <p className="text-3xl font-bold text-slate-900">Season 1</p>
          <p className="text-sm font-medium text-slate-600">Current Season</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-slate-900">{topEntry ? formatNumber(topEntry.finalScore) : '—'}</p>
          </div>
          <p className="text-sm font-medium text-slate-600">Top Score</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold text-slate-900">{topEntry ? `${topEntry.p99.toFixed(0)}ms` : '—'}</p>
          </div>
          <p className="text-sm font-medium text-slate-600">Lowest P99</p>
        </div>
      </div>
    </motion.div>
  );
}
