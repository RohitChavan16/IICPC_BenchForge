import { Activity, Clock, Database, Gauge, Timer, XCircle, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { WorkerStatus } from '@/types/api'
import { formatNumber, formatPercent, formatRelativeDate } from '@/utils/formatters'

const statusVariant = {
  Active: 'success',
  Idle: 'info',
  Offline: 'danger',
} as const

const statusDot = {
  Active: 'bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.55)]',
  Idle: 'bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.45)]',
  Offline: 'bg-rose-300 shadow-[0_0_16px_rgba(253,164,175,0.45)]',
} as const

function MetricTile({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className="min-w-0 rounded-3xl border border-white/10 bg-slate-950/75 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={16} className="shrink-0 text-cyan-300" />
        <p className="truncate text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-3 truncate text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

export function WorkerCard({ worker }: { worker: WorkerStatus }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/75 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDot[worker.status]}`} />
            <h2 className="truncate text-lg font-semibold text-white">{worker.workerId}</h2>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <Clock size={15} className="shrink-0" />
            <span>Last seen {formatRelativeDate(worker.lastSeen)}</span>
          </div>
        </div>
        <Badge variant={statusVariant[worker.status]}>{worker.status}</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="TPS" value={formatNumber(worker.tps)} icon={Activity} />
        <MetricTile label="P50" value={`${formatNumber(worker.p50)} ms`} icon={Timer} />
        <MetricTile label="P90" value={`${formatNumber(worker.p90)} ms`} icon={Gauge} />
        <MetricTile label="P99" value={`${formatNumber(worker.p99)} ms`} icon={Gauge} />
        <MetricTile label="Failure rate" value={formatPercent(worker.failureRate)} icon={XCircle} />
        <MetricTile label="Total requests" value={formatNumber(worker.total)} icon={Database} />
      </div>
    </article>
  )
}
