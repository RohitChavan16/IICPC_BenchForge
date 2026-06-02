import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchBenchmarkSessions } from '@/services/api/benchmarkService'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BenchmarkSessionCard } from '@/components/benchmark/BenchmarkSessionCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Search, FileX } from 'lucide-react'
import { formatDuration, formatNumber, formatRelativeDate } from '@/utils/formatters'

const statusVariants = {
  Running: 'info',
  Completed: 'success',
  Failed: 'danger',
  Queued: 'warning',
} as const

const statusOptions = ['All', 'Running', 'Completed', 'Failed', 'Queued'] as const
const sortOptions = [
  { key: 'updatedAt', label: 'Newest first' },
  { key: 'duration', label: 'Duration' },
  { key: 'p99', label: 'Latency p99' },
  { key: 'throughput', label: 'Throughput' },
] as const

type SortKey = (typeof sortOptions)[number]['key']

export function BenchmarkSessionsPage() {
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<typeof statusOptions[number]>('All')
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useQuery({ queryKey: ['benchmarkSessions'], queryFn: fetchBenchmarkSessions })

  const sessions = data?.items ?? []

  const filteredSessions = useMemo(() => {
    const normalized = filter.trim().toLowerCase()
    return sessions
      .filter((session) => statusFilter === 'All' || session.status === statusFilter)
      .filter((session) => !normalized || session.name.toLowerCase().includes(normalized))
      .sort((left, right) => {
        if (sortKey === 'updatedAt') {
          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
        }
        if (sortKey === 'duration') {
          return (right.duration ?? 0) - (left.duration ?? 0)
        }
        if (sortKey === 'p99') {
          return right.p99 - left.p99
        }
        const leftTps = left.duration ? left.totalRequests / left.duration : 0
        const rightTps = right.duration ? right.totalRequests / right.duration : 0
        return rightTps - leftTps
      })
  }, [filter, sessions, sortKey, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / 10))
  const visibleSessions = filteredSessions.slice((page - 1) * 10, page * 10)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const summary = useMemo(
    () => ({
      total: sessions.length,
      running: sessions.filter((session) => session.status === 'Running').length,
      completed: sessions.filter((session) => session.status === 'Completed').length,
    }),
    [sessions],
  )

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Skeleton className="h-4 w-40 mb-3" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-12 w-80 rounded-3xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center text-white">
        <p className="text-xl">Unable to load benchmark sessions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Benchmark orchestration</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Benchmark sessions</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/benchmarks/new"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-400"
          >
            Start Benchmark
          </Link>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value)
                setPage(1)
              }}
              placeholder="Search sessions"
              className="w-full rounded-3xl border border-white/10 bg-slate-950/80 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20 sm:w-80"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Active sessions" description="Running and queued benchmarks.">
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-5xl font-semibold text-cyan-300">{summary.total}</p>
              <p className="mt-2 text-sm text-slate-400">Total sessions</p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-sm text-slate-400">Running</p>
              <p className="text-lg font-semibold text-white">{summary.running}</p>
            </div>
          </div>
        </Card>
        <Card title="Completed workflows" description="Successful benchmark reports.">
          <div className="mt-4">
            <p className="text-5xl font-semibold text-emerald-300">{summary.completed}</p>
            <p className="mt-2 text-sm text-slate-400">Completed sessions</p>
          </div>
        </Card>
        <Card title="Queue pressure" description="Review throughput priority and backlog.">
          <div className="mt-4">
            <p className="text-5xl font-semibold text-violet-300">{Math.max(0, summary.total - summary.completed)}</p>
            <p className="mt-2 text-sm text-slate-400">Open sessions</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {filteredSessions.slice(0, 3).map((session) => (
          <BenchmarkSessionCard key={session.id} session={session} />
        ))}
      </div>

      <Card title="Benchmark sessions table" description="Search, filter, and inspect benchmark runs.">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status)
                  setPage(1)
                }}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  statusFilter === status
                    ? 'border-cyan-300 bg-cyan-500/10 text-white'
                    : 'border-white/10 bg-slate-950 text-slate-400 hover:border-cyan-300 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Sort by</label>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="rounded-3xl border border-white/10 bg-slate-950/80 py-2 px-4 text-sm text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-slate-950/90 text-slate-400">
              <tr>
                <th className="px-6 py-4">Session</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">TPS</th>
                <th className="px-6 py-4">p99</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {visibleSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <FileX className="h-12 w-12 text-slate-500 mb-3" />
                      <p className="text-lg font-medium text-white">No sessions found</p>
                      <p className="text-sm">We couldn't find any benchmark sessions matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleSessions.map((session) => {
                  const durationLabel = session.duration ? formatDuration(session.duration) : 'Running'
                  const tps = session.duration ? session.totalRequests / session.duration : 0
  
                  return (
                    <tr key={session.id} className="border-t border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{session.name}</p>
                        <p className="mt-1 text-xs text-slate-500">Updated {formatRelativeDate(session.updatedAt)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusVariants[session.status]}>{session.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-white">{tps ? formatNumber(tps) : '—'}</td>
                      <td className="px-6 py-4 text-white">{session.p99.toFixed(0)} ms</td>
                      <td className="px-6 py-4 text-slate-300">{durationLabel}</td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/benchmarks/${session.id}`} className="text-cyan-300 hover:text-white">
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-slate-400">
          <span>
            Showing page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="rounded-3xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
