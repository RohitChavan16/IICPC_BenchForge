import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { MetricSnapshot } from '@/types/api'

export function MetricSparkline({ data, dataKey }: { data: MetricSnapshot[]; dataKey: keyof MetricSnapshot }) {
  return (
    <div className="h-24 w-full rounded-3xl border border-border bg-background p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Tooltip content={null} />
          <Area type="monotone" dataKey={dataKey as string} stroke="#22d3ee" fill="url(#sparklineGradient)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
