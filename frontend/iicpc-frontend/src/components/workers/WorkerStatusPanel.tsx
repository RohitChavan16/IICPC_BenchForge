import { Activity, PauseCircle, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { WorkerStatus } from '@/types/api'

function countByStatus(workers: WorkerStatus[], status: WorkerStatus['status']) {
  return workers.filter((worker) => worker.status === status).length
}

export function WorkerStatusPanel({ workers }: { workers: WorkerStatus[] }) {
  const active = countByStatus(workers, 'Active')
  const idle = countByStatus(workers, 'Idle')
  const offline = countByStatus(workers, 'Offline')

  const statuses = [
    { label: 'Active', value: active, icon: Activity, variant: 'success' as const, detail: 'Workers seen in the active window.' },
    { label: 'Idle', value: idle, icon: PauseCircle, variant: 'info' as const, detail: 'Workers recently seen but not actively reporting.' },
    { label: 'Offline', value: offline, icon: WifiOff, variant: 'danger' as const, detail: 'Workers outside the last-seen threshold.' },
  ]

  return (
    <div className="grid gap-4">
      {statuses.map(({ label, value, icon: Icon, variant, detail }) => (
        <div key={label} className="rounded-3xl border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Icon size={18} className="shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
              </div>
            </div>
            <Badge variant={variant}>{value}</Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
