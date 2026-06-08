import { Card } from '@/components/ui/Card'
import { Cpu, Clock, Layers, Shield } from 'lucide-react'

interface WorkerExecutionAnalysisProps {
  benchmark: any
}

export function WorkerExecutionAnalysis({ benchmark }: WorkerExecutionAnalysisProps) {
  if (!benchmark) {
    return null
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-card-foreground">Worker Execution Analysis</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors shadow-[0_0_15px_rgba(var(--primary),0.03)] hover:shadow-[0_0_20px_rgba(var(--primary),0.08)]">
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
            <Layers className="w-4 h-4 text-primary" /> Workers Peak
          </div>
          <div className="text-xl font-bold font-mono text-foreground">{benchmark.workerCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.03)] hover:shadow-[0_0_20px_rgba(245,158,11,0.08)]">
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
            <Clock className="w-4 h-4 text-amber-500" /> Total Duration
          </div>
          <div className="text-xl font-bold font-mono text-foreground">{benchmark.duration}s</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.03)] hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]">
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
            <Shield className="w-4 h-4 text-emerald-500" /> Validated Tracers
          </div>
          <div className="text-xl font-bold font-mono text-emerald-500">
            {benchmark.tracerTotal || 0}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.03)] hover:shadow-[0_0_20px_rgba(168,85,247,0.08)]">
          <div className="text-sm text-muted-foreground mb-1">Total Requests</div>
          <div className="text-xl font-bold font-mono text-foreground">
            {benchmark.totalRequests.toLocaleString()}
          </div>
        </div>
      </div>
    </Card>
  )
}
