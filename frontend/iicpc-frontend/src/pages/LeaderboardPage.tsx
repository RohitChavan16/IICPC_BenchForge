import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Search, ChevronRight } from 'lucide-react'
import { fetchLeaderboardEntries, fetchTopLeaderboardEntries } from '@/services/api/leaderboardService'
import type { LeaderboardEntry } from '@/types/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatNumber, formatPercent, formatDuration, formatRelativeDate } from '@/utils/formatters'

const sortOptions = [
  { key: 'rank', label: 'Rank' },
  { key: 'finalScore', label: 'Score' },
  { key: 'tps', label: 'TPS' },
  { key: 'successRate', label: 'Success rate' },
  { key: 'p99', label: 'Latency p99' },
] as const

type SortKey = (typeof sortOptions)[number]['key']

function getBadgeVariant(entry: LeaderboardEntry) {
  if (entry.rank === 1) return 'success'
  if (entry.rank <= 3) return 'info'
  if (entry.successRate >= 99.5) return 'success'
  if (entry.p99 <= 200) return 'warning'
  return 'default'
}

function getPerformanceLabel(entry: LeaderboardEntry) {
  if (entry.rank === 1) return 'Champion'
  if (entry.rank <= 3) return 'Podium'
  if (entry.successRate >= 99.5) return 'Stable'
  if (entry.p99 <= 250) return 'Competitive'
  return 'Valid run'
}

export function LeaderboardPage() {
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('rank')

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboardEntries'],
    queryFn: fetchLeaderboardEntries,
    refetchInterval: 10000,
  })
  const { data: topData, isLoading: isTopLoading } = useQuery({
    queryKey: ['leaderboardTop'],
    queryFn: fetchTopLeaderboardEntries,
    refetchInterval: 10000,
  })


  const leaderboard = leaderboardData?.items ?? []
  const topEntries = topData ?? []

  const filteredEntries = useMemo(() => {
    const query = filter.trim().toLowerCase()
    return leaderboard
      .filter((entry) => {
        if (!query) return true
        return (
          entry.teamName.toLowerCase().includes(query) ||
          entry.submissionName.toLowerCase().includes(query) ||
          entry.benchmarkId.toLowerCase().includes(query)
        )
      })
      .sort((left, right) => {
        if (sortKey === 'rank') return left.rank - right.rank
        if (sortKey === 'finalScore') return right.finalScore - left.finalScore
        if (sortKey === 'tps') return right.tps - left.tps
        if (sortKey === 'successRate') return right.successRate - left.successRate
        return left.p99 - right.p99
      })
  }, [filter, leaderboard, sortKey])

  const hero = topEntries[0]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Competition results</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Leaderboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Rankings are generated automatically from completed benchmark runs. The scoreboard uses throughput, success rate and tail latency to place submissions.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Search team, submission, benchmark"
              className="w-full rounded-3xl border border-white/10 bg-slate-950/80 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20 sm:w-96"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="space-y-6" title="Top competitors" description="Leading benchmark runs from active teams.">
          <div className="grid gap-4 sm:grid-cols-3">
            {topEntries.slice(0, 3).map((entry, index) => (
              <div key={entry.id} className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 shadow-glow">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{index === 0 ? 'Gold' : index === 1 ? 'Silver' : 'Bronze'}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{entry.teamName}</p>
                  </div>
                  <Badge variant={index === 0 ? 'success' : index === 1 ? 'info' : 'warning'}>{entry.rank}</Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-slate-400">Submission</p>
                  <p className="text-base font-semibold text-white">{entry.submissionName}</p>
                </div>
                <div className="mt-4 grid gap-2 text-slate-400">
                  <p className="text-sm">Score <span className="text-white font-semibold">{formatNumber(entry.finalScore)}</span></p>
                  <p className="text-sm">TPS <span className="text-white font-semibold">{formatNumber(entry.tps)}</span></p>
                  <p className="text-sm">p99 <span className="text-white font-semibold">{entry.p99.toFixed(0)} ms</span></p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Live standing" description="Refreshes automatically to keep the competition current.">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Current leaderboard leader</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{hero?.teamName ?? 'No completed runs yet'}</p>
                </div>
                <div className="grid place-items-center rounded-3xl bg-cyan-500/10 px-4 py-3 text-cyan-300">
                  <Trophy size={30} />
                </div>
              </div>
              {hero ? (
                <div className="mt-4 text-sm text-slate-400 space-y-2">
                  <p>{hero.submissionName} · rank {hero.rank}</p>
                  <p>{hero.successRate.toFixed(1)}% success · {formatNumber(hero.tps)} TPS · {hero.p99.toFixed(0)} ms p99</p>
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
                <p className="text-sm text-slate-400">Leaderboard entries</p>
                <p className="mt-2 text-3xl font-semibold text-white">{leaderboard.length}</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
                <p className="text-sm text-slate-400">Best score</p>
                <p className="mt-2 text-3xl font-semibold text-white">{hero ? formatNumber(hero.finalScore) : '—'}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Leaderboard table" description="Full ranking from benchmark runs, updated live.">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="info">Live</Badge>
            <p className="text-sm text-slate-400">Auto refresh every 10 seconds.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
              <span className="font-semibold text-white">Sort by:</span>
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value as SortKey)}
                className="ml-3 bg-transparent text-sm text-white outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.key} value={option.key} className="bg-slate-950 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-slate-950/90 text-slate-400">
              <tr>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Team / Submission</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">TPS</th>
                <th className="px-6 py-4">Success</th>
                <th className="px-6 py-4">p99</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-6 py-4 text-white font-semibold">#{entry.rank}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">{entry.teamName}</p>
                    <p className="mt-1 text-xs text-slate-500">{entry.submissionName}</p>
                  </td>
                  <td className="px-6 py-4 text-white">{formatNumber(entry.finalScore)}</td>
                  <td className="px-6 py-4 text-white">{formatNumber(entry.tps)}</td>
                  <td className="px-6 py-4 text-emerald-300">{formatPercent(entry.successRate)}</td>
                  <td className="px-6 py-4 text-white">{entry.p99.toFixed(0)} ms</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/leaderboard/${entry.teamName}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-cyan-300 transition hover:bg-white/10"
                    >
                      View
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inline details removed in favor of LeaderboardDetailsPage */}
    </div>
  )
}
