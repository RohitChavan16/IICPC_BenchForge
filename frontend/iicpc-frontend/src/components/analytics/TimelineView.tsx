import { Card } from '@/components/ui/Card'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface TimelineViewProps {
  submission: any
  deployment: any
  benchmark: any
  leaderboardEntry: any
}

const stages = [
  { id: 'queued', label: 'Queued' },
  { id: 'build', label: 'Build & Deploy' },
  { id: 'correctness', label: 'Correctness Validation' },
  { id: 'simulation', label: 'Market Simulation' },
  { id: 'tracer', label: 'Tracer Concurrency' },
  { id: 'scoring', label: 'Final Score' }
]

export function TimelineView({ submission, benchmark, leaderboardEntry }: TimelineViewProps) {
  let currentStageIndex = 0

  if (submission.status === 'COMPLETED' || leaderboardEntry) {
    currentStageIndex = 6 // All completed
  } else if (submission.status === 'FAILED') {
    // Determine where it failed
    if (['UPLOAD', 'BUILD', 'DEPLOYMENT'].includes(submission.currentStage)) {
      currentStageIndex = 1
    } else if (submission.currentStage === 'VALIDATION') {
      currentStageIndex = 2
    } else if (benchmark) {
      currentStageIndex = 3
    }
  } else {
    // In progress
    if (submission.currentStage === 'UPLOAD' || submission.currentStage === 'BUILD' || submission.currentStage === 'DEPLOYMENT') {
      currentStageIndex = 1
    } else if (submission.currentStage === 'VALIDATION') {
      currentStageIndex = 2
    } else if (benchmark && benchmark.status === 'RUNNING') {
      currentStageIndex = 3
    } else if (benchmark && benchmark.status === 'COMPLETED') {
      currentStageIndex = 5 // Scoring
    }
  }

  return (
    <Card className="p-6 bg-card border-border overflow-hidden">
      <h3 className="text-lg font-semibold text-card-foreground mb-6">Evaluation Timeline</h3>
      
      <div className="relative">
        <div className="absolute top-1/2 left-[5%] right-[5%] h-[3px] bg-gradient-to-r from-muted via-primary/30 to-muted -translate-y-1/2 z-0 hidden md:block rounded-full"></div>
        <div className="flex flex-col md:flex-row justify-between gap-4 relative z-10">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex
            const isCurrent = idx === currentStageIndex && submission.status !== 'FAILED'
            const isFailed = idx === currentStageIndex && submission.status === 'FAILED'

            let Icon = Circle
            let color = 'text-muted-foreground/50 bg-muted border-muted-foreground/30 shadow-inner'
            let bgRing = 'bg-card'

            if (isCompleted) {
              Icon = CheckCircle2
              color = 'text-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
            } else if (isCurrent) {
              Icon = Loader2
              color = 'text-primary bg-primary/10 shadow-[0_0_10px_rgba(var(--primary),0.2)]'
              bgRing = 'ring-4 ring-primary/20 rounded-full bg-card'
            } else if (isFailed) {
              Icon = CheckCircle2
              color = 'text-rose-500 bg-rose-500/10 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
            }

            return (
              <div key={stage.id} className="flex md:flex-col items-center gap-3 bg-card md:bg-transparent">
                <div className={`relative flex items-center justify-center p-1.5 rounded-full ${bgRing}`}>
                  <Icon className={`w-6 h-6 rounded-full ${color} ${isCurrent ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex flex-col md:items-center">
                  <span className={`text-sm font-semibold ${isCompleted || isCurrent ? 'text-foreground' : isFailed ? 'text-rose-500' : 'text-muted-foreground/60'}`}>
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs text-primary mt-1 hidden md:block font-medium">In Progress</span>
                  )}
                  {isFailed && (
                    <span className="text-xs text-rose-500 mt-1 hidden md:block font-medium">Failed</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
