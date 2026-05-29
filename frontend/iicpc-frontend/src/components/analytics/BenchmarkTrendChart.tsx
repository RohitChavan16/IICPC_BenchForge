import React, { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { BenchmarkSession } from '@/types/api'
import { computeTps, computeSuccessRate } from '@/services/api/analyticsService'

type MetricKey = 'tps' | 'successRate' | 'p50' | 'p90' | 'p99' | 'totalRequests'

export function BenchmarkTrendChart({
  sessions,
  metric = 'tps',
  title,
}: {
  sessions: BenchmarkSession[]
  metric?: MetricKey
  title?: string
}) {
  const data = useMemo(() => {
    const completed = sessions.slice().sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    return completed.map((s, idx) => {
      const tps = computeTps(s)
      const successRate = computeSuccessRate(s)
      const point: any = {
        label: `${new Date(s.startedAt).toLocaleDateString()} ${new Date(s.startedAt).toLocaleTimeString()}`,
        index: idx,
        tps,
        successRate,
        p50: s.p50,
        p90: s.p90,
        p99: s.p99,
        totalRequests: s.totalRequests,
      }
      return point
    })
  }, [sessions])

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-4">
      <div className="mb-3">
        <p className="text-sm text-slate-400">{title ?? 'Trend'}</p>
      </div>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tickFormatter={(v) => v} />
            <YAxis />
            <Tooltip labelFormatter={(l) => String(l)} />
            <Line type="monotone" dataKey={metric} stroke="#06b6d4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
