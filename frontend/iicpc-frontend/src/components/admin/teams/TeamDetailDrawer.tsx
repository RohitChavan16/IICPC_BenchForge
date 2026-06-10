import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Activity, Zap, Clock, ShieldCheck, Calendar, Hash } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';
import { formatNumber, formatPercent } from '@/utils/formatters';

interface TeamDetailDrawerProps {
  team: LeaderboardEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamDetailDrawer({ team, isOpen, onClose }: TeamDetailDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && team && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-background shadow-2xl sm:max-w-lg"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-6 bg-gradient-to-r from-teal-950/20 to-background">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{team.teamName}</h2>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash size={14} /> {team.id}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Status & Ranking */}
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Competition Standing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
                      <div className="flex items-center gap-2 text-teal-500 mb-2">
                        <Trophy size={16} />
                        <span className="text-xs font-semibold uppercase">Current Rank</span>
                      </div>
                      <p className="text-3xl font-bold text-foreground">#{team.rank}</p>
                    </div>
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                      <div className="flex items-center gap-2 text-blue-500 mb-2">
                        <Target size={16} />
                        <span className="text-xs font-semibold uppercase">Final Score</span>
                      </div>
                      <p className="text-3xl font-bold text-foreground">{formatNumber(team.finalScore)}</p>
                    </div>
                  </div>
                </section>

                {/* Latest Submission Info */}
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Submission Details</h3>
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <span className="text-sm text-muted-foreground">Submission Name</span>
                      <span className="text-sm font-medium text-foreground">{team.submissionName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <span className="text-sm text-muted-foreground">Benchmark ID</span>
                      <span className="text-sm font-mono text-muted-foreground truncate max-w-[200px]" title={team.benchmarkId}>{team.benchmarkId}</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-2"><Calendar size={14}/> Recorded At</span>
                      <span className="text-sm font-medium text-foreground">{new Date(team.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </section>

                {/* Best Performance Metrics */}
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Best Performance Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-500">
                          <Zap size={16} />
                        </div>
                        <span className="text-sm font-medium text-foreground">Best TPS</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">{formatNumber(team.tps)}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/20 text-indigo-500">
                          <Clock size={16} />
                        </div>
                        <span className="text-sm font-medium text-foreground">Lowest P99</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-400">{team.p99.toFixed(0)} ms</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/20 text-cyan-500">
                          <ShieldCheck size={16} />
                        </div>
                        <span className="text-sm font-medium text-foreground">Correctness</span>
                      </div>
                      <span className="font-mono font-bold text-cyan-400">{formatPercent(team.successRate)}</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/20 text-purple-500">
                          <Activity size={16} />
                        </div>
                        <span className="text-sm font-medium text-foreground">Total Requests</span>
                      </div>
                      <span className="font-mono font-bold text-purple-400">{formatNumber(team.totalRequests)}</span>
                    </div>
                  </div>
                </section>
                
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Needed to import Target above
import { Target } from 'lucide-react';
