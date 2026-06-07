import { Card } from '@/components/ui/Card'
import type { TracerStats } from '@/types/api'
import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react'

interface TracerVisibilityPanelProps {
  stats: TracerStats
}

export function TracerVisibilityPanel({ stats }: TracerVisibilityPanelProps) {
  return (
    <Card className="p-6 bg-card border-amber-500/20">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-card-foreground">Tracer Visibility</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Executed</div>
          <div className="text-2xl font-bold font-mono text-foreground">{stats.executed}</div>
        </div>
        
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-sm text-emerald-500 mb-1">
            <CheckCircle2 className="w-4 h-4" /> Passed
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-500">{stats.passed}</div>
        </div>

        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-center gap-2 text-sm text-rose-500 mb-1">
            <XCircle className="w-4 h-4" /> Failed
          </div>
          <div className="text-2xl font-bold font-mono text-rose-500">{stats.failed}</div>
        </div>
      </div>
      <div className="mt-4 text-xs text-muted-foreground italic text-center">
        *Tracer symbol injections are masked to preserve evaluation integrity.
      </div>
    </Card>
  )
}
