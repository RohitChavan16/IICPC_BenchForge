import React from 'react'
import type { InfrastructureMetric } from '@/types/api'
import { Badge } from '@/components/ui/Badge'

type Props = {
  metric: InfrastructureMetric
  loading?: boolean
  error?: boolean
}

export const MetricCard: React.FC<Props> = ({ metric, loading = false, error = false }) => {
  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-5">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-5">
        <div className="text-red-400">Error loading metric</div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-5">
      <div className="flex items-center justify-between gap-3 text-slate-400">
        <p>{metric.label}</p>
        <Badge variant={metric.trend === 'up' ? 'warning' : metric.trend === 'down' ? 'success' : 'info'}>{metric.trend}</Badge>
      </div>
      <p className="mt-4 text-3xl font-semibold text-white">{metric.value}</p>
      {metric.detail ? <p className="mt-2 text-sm text-slate-500">{metric.detail}</p> : null}
    </div>
  )
}
