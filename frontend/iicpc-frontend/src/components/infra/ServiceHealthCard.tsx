import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { instantQuery } from '@/services/prometheus/prometheus'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

type Props = {
  label: string
  job: string
}

function formatPercent(v: number | null) {
  if (v === null || typeof v !== 'number' || Number.isNaN(v)) return '-'
  return `${(v * 100).toFixed(1)}%`
}

export const ServiceHealthCard: React.FC<Props> = ({ label, job }) => {
  // instant up
  const { data: upData, isLoading: upLoading, isError: upError } = useQuery(['service_up', job], () => instantQuery(`up{job=\"${job}\"}`), { staleTime: 5000 })

  // availability over 15m
  const { data: availData, isLoading: availLoading, isError: availError } = useQuery(['service_avail', job], () => instantQuery(`avg_over_time(up{job=\"${job}\"}[15m])`), { staleTime: 5000 })

  const upValue = upData && upData.length > 0 ? Number(upData[0].value[1]) : null
  const lastScrapeTs = upData && upData.length > 0 ? Number(upData[0].value[0]) * 1000 : null
  const availValue = availData && availData.length > 0 ? Number(availData[0].value[1]) : null

  const isHealthy = upValue === 1

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-1 text-lg font-semibold text-white">{isLoadingOrError(upLoading, upError) ? 'N/A' : isHealthy ? 'Healthy' : 'Degraded'}</p>
        </div>
        <Badge variant={isHealthy ? 'success' : 'warning'}>{isHealthy ? 'UP' : 'DOWN'}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-slate-400">
        <div>
          <p>Availability (15m)</p>
          <p className="mt-1 text-white">{availLoading || availError ? '-' : formatPercent(availValue)}</p>
        </div>

        <div>
          <p>Last scrape</p>
          <p className="mt-1 text-white">{lastScrapeTs ? new Date(lastScrapeTs).toLocaleString() : '-'}</p>
        </div>

        <div>
          <p>Job</p>
          <p className="mt-1 text-white">{job}</p>
        </div>
      </div>

      {(upLoading || availLoading) && <div className="mt-3 text-slate-400">Loading...</div>}
      {(upError || availError) && <div className="mt-3 text-red-400">Failed to fetch service metrics from Prometheus.</div>}
    </div>
  )
}

function isLoadingOrError(loading: boolean, error: boolean) {
  return loading || error
}
