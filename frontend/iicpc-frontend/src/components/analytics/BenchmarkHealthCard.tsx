import { Card } from '@/components/ui/Card'
import { Activity, ShieldCheck, Zap, ServerCog, Target, CheckCircle2, XCircle } from 'lucide-react'

interface BenchmarkHealthCardProps {
  benchmark: any
  leaderboardEntry: any
  submission: any
}

export function BenchmarkHealthCard({ benchmark, leaderboardEntry, submission }: BenchmarkHealthCardProps) {
  if (!benchmark || !leaderboardEntry) {
    return null
  }

  const tps = leaderboardEntry.tps
  const p99 = leaderboardEntry.p99
  const successRate = leaderboardEntry.successRate
  const correctness = leaderboardEntry.correctnessScore ?? submission.correctnessScore ?? 100
  const concurrency = leaderboardEntry.concurrencyScore ?? 100
  const status = benchmark.status

  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">Benchmark Health Profile</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/50 border border-border/50 text-center">
          <Zap className="w-5 h-5 text-emerald-500 mb-2" />
          <div className="text-sm text-muted-foreground">Effective TPS</div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">{tps.toFixed(2)}</div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/50 border border-border/50 text-center">
          <Activity className="w-5 h-5 text-amber-500 mb-2" />
          <div className="text-sm text-muted-foreground">P99 Latency</div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">{p99.toFixed(2)}ms</div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/50 border border-border/50 text-center">
          <Target className="w-5 h-5 text-blue-500 mb-2" />
          <div className="text-sm text-muted-foreground">Success Rate</div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">{successRate.toFixed(1)}%</div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/50 border border-border/50 text-center">
          <ShieldCheck className="w-5 h-5 text-purple-500 mb-2" />
          <div className="text-sm text-muted-foreground">Correctness</div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">{correctness.toFixed(1)}%</div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/50 border border-border/50 text-center">
          <ServerCog className="w-5 h-5 text-cyan-500 mb-2" />
          <div className="text-sm text-muted-foreground">Concurrency</div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">{concurrency.toFixed(1)}%</div>
        </div>

        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-secondary/50 border border-border/50 text-center">
          {status === 'COMPLETED' ? (
             <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2" />
          ) : (
             <XCircle className="w-5 h-5 text-rose-500 mb-2" />
          )}
          <div className="text-sm text-muted-foreground">Status</div>
          <div className={`text-sm font-bold mt-1 ${status === 'COMPLETED' ? 'text-emerald-500' : 'text-rose-500'}`}>{status}</div>
        </div>
      </div>
    </Card>
  )
}
