import { Link } from 'react-router-dom'
import type { BenchmarkSession } from '@/types/api'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatDuration, formatNumber } from '@/utils/formatters'

const statusVariants = {
  Running: 'info',
  Completed: 'success',
  Failed: 'danger',
  Queued: 'warning',
} as const

interface BenchmarkSessionCardProps {
  session: BenchmarkSession
}

export function BenchmarkSessionCard({ session }: BenchmarkSessionCardProps) {
  const throughput = session.duration ? session.totalRequests / session.duration : 0

  return (
    <Card
      title={session.name}
      description={`Updated ${new Date(session.updatedAt).toLocaleDateString()}`}
      className="min-h-[220px]"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <Badge variant={statusVariants[session.status]}>{session.status}</Badge>
        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-400">
          {session.workerCount} workers
        </span>
      </div>

      <div className="grid gap-3">
        <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-4 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Throughput</p>
          <p className="mt-2 text-2xl font-semibold text-white">{throughput ? formatNumber(throughput) : '—'}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-4 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">p99</p>
            <p className="mt-2 text-lg font-semibold text-white">{session.p99.toFixed(0)} ms</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-4 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Duration</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {session.duration ? formatDuration(session.duration) : 'Running'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-right">
        <Link to={`/benchmarks/${session.id}`} className="text-cyan-300 hover:text-white">
          View details
        </Link>
      </div>
    </Card>
  )
}
