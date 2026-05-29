import React from 'react'
import type { BenchmarkSession } from '@/types/api'
import { formatNumber, formatDuration, formatPercent } from '@/utils/formatters'

export function BenchmarkComparisonCard({
  metric,
  base,
  compare,
}: {
  metric: string
  base: number | string
  compare: number | string
}) {
  const diff = typeof base === 'number' && typeof compare === 'number' ? compare - base : null
  const diffLabel = diff === null ? '' : `${diff >= 0 ? '+' : ''}${Number(diff).toFixed(1)}`

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/75 p-4 text-sm text-slate-300">
      <p className="text-xs text-slate-500">{metric}</p>
      <div className="mt-2 flex items-baseline gap-4">
        <div>
          <p className="text-xs text-slate-400">Base</p>
          <p className="text-lg font-semibold text-white">{String(base)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Compare</p>
          <p className="text-lg font-semibold text-white">{String(compare)}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-slate-400">Δ</p>
          <p className="text-lg font-semibold text-white">{diffLabel}</p>
        </div>
      </div>
    </div>
  )
}
