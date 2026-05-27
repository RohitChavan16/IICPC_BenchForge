import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchBenchmarkSessions } from '@/services/api/benchmarkService'
import type { BenchmarkSession } from '@/types/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Search } from 'lucide-react'

const statusVariants = {
  Running: 'info',
  Completed: 'success',
  Failed: 'danger',
  Queued: 'warning',
} as const

export function BenchmarkSessionsPage() {
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const { data } = useQuery(['benchmarkSessions', page, filter], () => fetchBenchmarkSessions(page, 10, filter))

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 10))
  const sessions = data?.items ?? []

  const summary = useMemo(() => ({
    total: data?.total ?? 0,
    running: sessions.filter((session) => session.status === 'Running').length,
    completed: sessions.filter((session) => session.status === 'Completed').length,
  }), [data?.total, sessions])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Benchmark orchestration</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Benchmark sessions</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={filter}
              onChange={(event) => { setFilter(event.target.value); setPage(1) }}
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

      <Card title="Benchmark sessions table" description="Search, filter, and inspect benchmark runs.">
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
              {sessions.map((session) => (
                <tr key={session.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">{session.name}</p>
                    <p className="mt-1 text-xs text-slate-500">Updated {session.updatedAt.split('T')[0]}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusVariants[session.status]}>{session.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-white">{session.metrics.tps}</td>
                  <td className="px-6 py-4 text-white">{session.metrics.p99} ms</td>
                  <td className="px-6 py-4 text-slate-300">{session.duration}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/benchmarks/${session.id}`} className="text-cyan-300 hover:text-white">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
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
