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
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0 hidden md:block"></div>
        <div className="flex flex-col md:flex-row justify-between gap-4 relative z-10">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex
            const isCurrent = idx === currentStageIndex && submission.status !== 'FAILED'
            const isFailed = idx === currentStageIndex && submission.status === 'FAILED'

            let Icon = Circle
            let color = 'text-muted-foreground bg-background border-muted-foreground'
            let bgRing = 'bg-background'

            if (isCompleted) {
              Icon = CheckCircle2
              color = 'text-emerald-500 bg-background'
            } else if (isCurrent) {
              Icon = Loader2
              color = 'text-primary bg-background animate-spin'
              bgRing = 'ring-4 ring-primary/20 rounded-full'
            } else if (isFailed) {
              Icon = CheckCircle2 // or XCircle, but XCircle is a different style. Actually let's use a red circle
              color = 'text-rose-500 bg-background'
            }

            return (
              <div key={stage.id} className="flex md:flex-col items-center gap-3 bg-card md:bg-transparent">
                <div className={`relative flex items-center justify-center p-1 bg-card ${bgRing}`}>
                  <Icon className={`w-6 h-6 ${color} ${isCurrent ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex flex-col md:items-center">
                  <span className={`text-sm font-medium ${isCompleted || isCurrent ? 'text-foreground' : isFailed ? 'text-rose-500' : 'text-muted-foreground'}`}>
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs text-primary mt-1 hidden md:block">In Progress</span>
                  )}
                  {isFailed && (
                    <span className="text-xs text-rose-500 mt-1 hidden md:block">Failed</span>
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
