import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Server, Zap, CheckCircle, ArrowLeft, Trophy } from 'lucide-react'
import * as submissionService from '@/services/api/submissionService'
import * as deploymentService from '@/services/api/deploymentService'
import * as benchmarkService from '@/services/api/benchmarkService'
import { fetchLeaderboardEntries } from '@/services/api/leaderboardService'

export function SubmissionReportPage() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      setLoading(true)
      try {
        // MVP: Frontend aggregation
        // 1. Get all submissions (no GET /id yet in submissionService, so we list and find)
        const subs = await submissionService.listSubmissions()
        const submission = subs.find(s => s.id === id)
        
        // 2. Get deployment
        const deps = await deploymentService.listDeployments()
        const deployment = deps.items.find(d => d.submissionId === id)
        
        // 3. Get benchmark
        let benchmark = null
        if (deployment) {
          const benchs = await benchmarkService.fetchBenchmarkSessions()
          benchmark = benchs.items.find((b: any) => b.deploymentId === deployment.id)
        }
        
        // 4. Get leaderboard position
        let leaderboardEntry = null
        if (benchmark) {
          const lb = await fetchLeaderboardEntries()
          leaderboardEntry = lb.items.find((e: any) => e.benchmarkId === benchmark.id)
        }

        setData({ submission, deployment, benchmark, leaderboardEntry })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Loading report...</div>
  }

  if (!data || !data.submission) {
    return <div className="text-center py-20 text-slate-400">Submission not found.</div>
  }

  const { submission, deployment, benchmark, leaderboardEntry } = data

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link to="/submit" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2 mb-4">
          <ArrowLeft size={16} /> Back to Submissions
        </Link>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Submission Report</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{submission.submissionName}</h1>
        <div className="mt-2 flex items-center gap-4 text-sm text-slate-400">
          <span className="px-2 py-1 bg-white/10 rounded-full">{submission.language}</span>
          <span>Created: {new Date(submission.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {leaderboardEntry && (
        <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Trophy className="text-emerald-400" />
                Rank #{leaderboardEntry.rank}
              </h2>
              <p className="text-slate-300 mt-1">Final Score: <span className="text-emerald-400 font-bold">{leaderboardEntry.finalScore.toFixed(2)}</span></p>
            </div>
            <Link to={`/leaderboard/${leaderboardEntry.teamName}`}>
              <Button variant="secondary" className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20">
                View on Leaderboard
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Build Status">
          <div className="mt-4 flex items-center gap-4">
            <CheckCircle className="text-emerald-400" size={24} />
            <div>
              <p className="text-white font-medium">{submission.status}</p>
              <p className="text-xs text-slate-400 mt-1">Image: {submission.containerImage || 'N/A'}</p>
            </div>
          </div>
        </Card>

        <Card title="Deployment">
          <div className="mt-4 flex items-center gap-4">
            <Server className={deployment ? 'text-cyan-400' : 'text-slate-600'} size={24} />
            <div>
              <p className="text-white font-medium">{deployment ? deployment.deploymentStatus : 'Pending'}</p>
              {deployment && <p className="text-xs text-slate-400 mt-1">Port: {deployment.hostPort}</p>}
            </div>
          </div>
        </Card>

        <Card title="Benchmark">
          <div className="mt-4 flex items-center gap-4">
            <Zap className={benchmark ? 'text-violet-400' : 'text-slate-600'} size={24} />
            <div>
              <p className="text-white font-medium">{benchmark ? benchmark.status : 'Pending'}</p>
              {benchmark && <p className="text-xs text-slate-400 mt-1">Total Requests: {benchmark.totalRequests}</p>}
            </div>
          </div>
        </Card>
      </div>

      {benchmark && benchmark.status === 'COMPLETED' && leaderboardEntry && (
        <Card title="Performance Metrics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <p className="text-sm text-slate-400 mb-1">Throughput</p>
              <p className="text-2xl font-semibold text-cyan-400">{leaderboardEntry.tps.toFixed(0)} <span className="text-sm font-normal text-slate-500">TPS</span></p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <p className="text-sm text-slate-400 mb-1">Latency p50</p>
              <p className="text-2xl font-semibold text-emerald-400">{(leaderboardEntry.p50).toFixed(2)} <span className="text-sm font-normal text-slate-500">ms</span></p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <p className="text-sm text-slate-400 mb-1">Latency p99</p>
              <p className="text-2xl font-semibold text-rose-400">{(leaderboardEntry.p99).toFixed(2)} <span className="text-sm font-normal text-slate-500">ms</span></p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <p className="text-sm text-slate-400 mb-1">Success Rate</p>
              <p className="text-2xl font-semibold text-purple-400">{(leaderboardEntry.successRate).toFixed(1)} <span className="text-sm font-normal text-slate-500">%</span></p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
