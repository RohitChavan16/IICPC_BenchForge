import React, { useMemo, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { fetchPrometheusRange, type TimeWindow } from '@/services/prometheus/prometheusQueries'
import { TimeRangeSelector } from './TimeRangeSelector'

type Props = {
  promql: string
  title?: string
  unit?: string
}

function formatSeriesToChart(data: any[]) {
  // data: PrometheusMatrixResult[]
  if (!data || data.length === 0) return { seriesNames: [], dataPoints: [] }

  // Assume aligned timestamps
  const first = data[0]
  const length = first.values.length
  const dataPoints: Record<string, any>[] = []

  for (let i = 0; i < length; i += 1) {
    const ts = Number(first.values[i][0]) * 1000
    const point: Record<string, any> = { timestamp: ts }
    for (let s = 0; s < data.length; s += 1) {
      const series = data[s]
      const name = Object.entries(series.metric).map(([k, v]) => `${k}=${v}`).join(',') || `series_${s}`
      const val = Number(series.values[i][1])
      point[name] = Number.isFinite(val) ? val : null
    }
    dataPoints.push(point)
  }

  const seriesNames = data.map((d) => (Object.keys(d.metric).length > 0 ? Object.entries(d.metric).map(([k, v]) => `${k}=${v}`).join(',') : d.metric.__name__ || 'series'))
  return { seriesNames, dataPoints }
}

export const MetricTrendChart: React.FC<Props> = ({ promql, title, unit }) => {
  const [range, setRange] = useState<TimeWindow>('5m')

  const { data, isLoading, isError } = useQuery({ queryKey: ['prom_range', promql, range], queryFn: () => fetchPrometheusRange(promql, range), refetchInterval: false })

  const { seriesNames, dataPoints } = useMemo(() => formatSeriesToChart(data ?? []), [data])

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-slate-400">{title ?? promql}</p>
          {unit ? <p className="text-xs text-slate-500">Unit: {unit}</p> : null}
        </div>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      <div style={{ width: '100%', height: 200 }}>
        {isLoading ? (
          <div className="text-slate-400">Loading chart...</div>
        ) : isError ? (
          <div className="text-red-400">Failed to load chart data.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataPoints}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                domain={["dataMin", "dataMax"]}
                type="number"
              />
              <YAxis />
              <Tooltip labelFormatter={(t) => new Date(Number(t)).toLocaleString()} />
              <Legend />
              {seriesNames.map((name, idx) => (
                <Line key={name} type="monotone" dataKey={name} stroke={["#22c55e", "#06b6d4", "#a78bfa", "#f97316"][idx % 4]} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
