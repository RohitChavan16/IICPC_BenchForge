import React from 'react'
import type { HealthStatus } from '@/types/api'
import { Badge } from '@/components/ui/Badge'

type Props = {
  status: HealthStatus
  loading?: boolean
  error?: boolean
}

export const HealthCard: React.FC<Props> = ({ status, loading = false, error = false }) => {
  if (loading) return <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-4 text-slate-400">Loading...</div>
  if (error) return <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-4 text-red-400">Failed to load</div>

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{status.label}</p>
          <p className="mt-2 text-lg font-semibold text-white">{status.details}</p>
        </div>
        <Badge variant={status.status === 'Healthy' ? 'success' : status.status === 'Warning' ? 'warning' : 'danger'}>{status.status}</Badge>
      </div>
    </div>
  )
}
