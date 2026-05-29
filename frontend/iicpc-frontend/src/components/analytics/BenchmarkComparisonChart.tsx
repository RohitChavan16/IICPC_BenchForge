import React, { useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import type { BenchmarkSession } from '@/types/api'
import { computeTps, computeSuccessRate } from '@/services/api/analyticsService'

export function BenchmarkComparisonChart({ sessions }: { sessions: BenchmarkSession[] }) {
  const data = useMemo(() => {
    // Prepare data points: one per metric, values keyed by session label
    const labels = sessions.map((s) => s.name)
    const metrics = ['Duration', 'TPS', 'SuccessRate', 'p50', 'p90', 'p99']
    const rows: any[] = metrics.map((m) => {
      const row: any = { metric: m }
      sessions.forEach((s, i) => {
        const key = `r${i}`
        if (m === 'Duration') row[key] = s.duration ?? 0
        else if (m === 'TPS') row[key] = computeTps(s)
        else if (m === 'SuccessRate') row[key] = computeSuccessRate(s)
        else if (m === 'p50') row[key] = s.p50
        else if (m === 'p90') row[key] = s.p90
        else if (m === 'p99') row[key] = s.p99
      })
      return row
    })
    return { rows, labels }
  }, [sessions])

  const colors = ['#06b6d4', '#22c55e', '#f97316', '#a78bfa']

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-4">
      <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.rows} margin={{ top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Legend />
            {sessions.map((s, i) => (
              <Bar key={s.id} dataKey={`r${i}`} fill={colors[i % colors.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
