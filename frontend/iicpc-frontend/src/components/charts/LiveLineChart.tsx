import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MetricSnapshot } from '@/types/api'

export function LiveLineChart({ data }: { data: MetricSnapshot[] }) {
  return (
    <div className="h-96 w-full rounded-[32px] border border-border bg-card p-4 shadow-glow">
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground">Live Telemetry Stream</p>
          <p>Real-time request load and latency distribution</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 18, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="timestamp" axisLine={false} tickLine={false} stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'rgba(148,163,184,0.12)' }} />
          <Legend wrapperStyle={{ color: '#cbd5e1' }} />
          <Line dataKey="tps" stroke="#22d3ee" strokeWidth={2} dot={false} />
          <Line dataKey="p90" stroke="#a78bfa" strokeWidth={2} dot={false} />
          <Line dataKey="failureRate" stroke="#fb7185" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
