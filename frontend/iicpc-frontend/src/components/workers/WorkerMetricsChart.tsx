import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { WorkerMetricSnapshot } from '@/types/api'

function formatTick(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function EmptyChart() {
  return (
    <div className="flex h-72 items-center justify-center rounded-3xl border border-white/10 bg-slate-950/75 text-sm text-slate-400">
      Waiting for live worker samples.
    </div>
  )
}

export function WorkerMetricsChart({ workerId, data }: { workerId: string; data: WorkerMetricSnapshot[] }) {
  if (data.length === 0) {
    return <EmptyChart />
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300/80">TPS trend</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 18, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="timestamp" tickFormatter={formatTick} axisLine={false} tickLine={false} stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={formatTick} contentStyle={{ background: '#0f172a', borderColor: 'rgba(148,163,184,0.12)' }} />
              <Line name={`${workerId} TPS`} dataKey="tps" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300/80">Latency trend</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 18, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="timestamp" tickFormatter={formatTick} axisLine={false} tickLine={false} stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={formatTick} contentStyle={{ background: '#0f172a', borderColor: 'rgba(148,163,184,0.12)' }} />
              <Line name="P50" dataKey="p50" stroke="#67e8f9" strokeWidth={2} dot={false} />
              <Line name="P90" dataKey="p90" stroke="#a78bfa" strokeWidth={2} dot={false} />
              <Line name="P99" dataKey="p99" stroke="#fb7185" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300/80">Request volume</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 18, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="timestamp" tickFormatter={formatTick} axisLine={false} tickLine={false} stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={formatTick} contentStyle={{ background: '#0f172a', borderColor: 'rgba(148,163,184,0.12)' }} />
              <Bar name="Total requests" dataKey="total" fill="#34d399" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
