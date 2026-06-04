import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Server, Zap, CheckCircle, ArrowLeft, Trophy, BarChart2, Activity, Play, XCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import * as submissionService from '@/services/api/submissionService'
import * as deploymentService from '@/services/api/deploymentService'
import * as benchmarkService from '@/services/api/benchmarkService'
import { fetchLeaderboardEntries } from '@/services/api/leaderboardService'
import { fetchBenchmarkTelemetryHistory } from '@/services/api/telemetryService'

export function SubmissionReportPage() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      setLoading(true)
      try {
        const subs = await submissionService.listSubmissions()
        const submission = subs.find(s => s.id === id)
        
        const deps = await deploymentService.listDeployments()
        const deployment = deps.items.find(d => d.submissionId === id)
        
        let benchmark = null
        if (deployment) {
          const benchs = await benchmarkService.fetchBenchmarkSessions()
          benchmark = benchs.items.find((b: any) => b.deploymentId === deployment.id)
        }
        
        let leaderboardEntry = null
        let history = []
        if (benchmark) {
          const lb = await fetchLeaderboardEntries()
          leaderboardEntry = lb.items.find((e: any) => e.benchmarkId === benchmark.id)
          history = await fetchBenchmarkTelemetryHistory(benchmark.id)
        }

        setData({ submission, deployment, benchmark, leaderboardEntry, history })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Loading report...</div>
  }

  if (!data || !data.submission) {
    return <div className="text-center py-20 text-muted-foreground">Submission not found.</div>
  }

  const { submission, deployment, benchmark, leaderboardEntry, history } = data

  // Score Calculations
  let correctnessScore = 0
  let correctnessPart = 0
  let tpsPart = 0
  let p99Part = 0
  let finalScore = 0

  if (leaderboardEntry) {
    correctnessScore = leaderboardEntry.correctnessScore || 0
    correctnessPart = Math.max(0, correctnessScore) * 0.5
    
    let tpsS = (leaderboardEntry.tps / 20000.0) * 100.0
    if (tpsS > 100) tpsS = 100
    tpsPart = tpsS * 0.3

    let p99S = 100.0 - (leaderboardEntry.p99 / 10.0)
    if (p99S > 100) p99S = 100
    if (p99S < 0) p99S = 0
    p99Part = p99S * 0.2

    finalScore = leaderboardEntry.finalScore
  }

  const formatHistoryData = (historyData: any[]) => {
    return historyData.map((d: any) => ({
      time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tps: d.tps || 0,
      successRate: d.success_rate || 0,
      latency: d.p50 || 0
    }))
  }

  const chartData = history ? formatHistoryData(history) : []

  let buildState = "PENDING"
  let deployState = "PENDING"
  let benchState = "PENDING"

  if (submission.status?.toLowerCase() === 'completed') {
    buildState = "COMPLETED"
    deployState = "COMPLETED"
    benchState = "COMPLETED"
  } else if (submission.status?.toLowerCase() === 'failed') {
    if (['UPLOAD', 'BUILD'].includes(submission.currentStage)) {
      buildState = "FAILED"
      deployState = "ABORTED"
      benchState = "ABORTED"
    } else if (submission.currentStage === 'DEPLOYMENT' || submission.currentStage === 'VALIDATION') {
      buildState = "COMPLETED"
      deployState = "FAILED"
      benchState = "ABORTED"
    } else {
      buildState = "COMPLETED"
      deployState = deployment ? deployment.deploymentStatus : "RUNNING"
      benchState = "FAILED"
    }
  } else {
    if (['UPLOAD', 'BUILD'].includes(submission.currentStage)) {
      buildState = "BUILDING"
    } else if (submission.currentStage === 'DEPLOYMENT' || submission.currentStage === 'VALIDATION') {
      buildState = "COMPLETED"
      deployState = deployment ? deployment.deploymentStatus : "STARTING"
    } else {
      buildState = "COMPLETED"
      deployState = deployment ? deployment.deploymentStatus : "RUNNING"
      benchState = benchmark ? benchmark.status : "STARTING"
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link to="/submit" className="text-primary hover:text-primary text-sm flex items-center gap-2 mb-4">
          <ArrowLeft size={16} /> Back to Submissions
        </Link>
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Submission Report</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">{submission.submissionName}</h1>
        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="px-2 py-1 bg-muted rounded-full">{submission.language}</span>
          <span>Created: {new Date(submission.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {leaderboardEntry && (
        <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Trophy className="text-emerald-400" />
                Rank #{leaderboardEntry.rank}
              </h2>
              <p className="text-muted-foreground mt-1">Final Score: <span className="text-emerald-400 font-bold">{finalScore.toFixed(2)}</span></p>
            </div>
            <Link to={`/leaderboard/${leaderboardEntry.teamName}`}>
              <Button variant="secondary" className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20">
                View on Leaderboard
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Overview Details Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Build Status">
          <div className="mt-4 flex items-start gap-4">
            {buildState === 'FAILED' ? (
              <XCircle className="text-rose-400 mt-1" size={24} />
            ) : buildState === 'COMPLETED' ? (
              <CheckCircle className="text-emerald-400 mt-1" size={24} />
            ) : (
              <CheckCircle className="text-primary mt-1" size={24} />
            )}
            <div>
              <p className={`font-medium ${
                buildState === 'FAILED' ? 'text-rose-400' :
                buildState === 'COMPLETED' ? 'text-emerald-400' :
                'text-primary'
              }`}>
                {buildState}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Image: <span className="text-muted-foreground">{submission.containerImage || 'N/A'}</span></p>
            </div>
          </div>
        </Card>

        <Card title="Deployment">
          <div className="mt-4 flex items-start gap-4">
            {deployState === 'FAILED' || deployState === 'ABORTED' ? (
              <XCircle className="text-rose-400 mt-1" size={24} />
            ) : deployState === 'COMPLETED' || deployState === 'RUNNING' ? (
              <Server className="text-emerald-400 mt-1" size={24} />
            ) : (
              <Server className="text-slate-600 mt-1" size={24} />
            )}
            <div>
              <p className={`font-medium ${
                deployState === 'FAILED' || deployState === 'ABORTED' ? 'text-rose-400' :
                deployState === 'COMPLETED' || deployState === 'RUNNING' ? 'text-emerald-400' :
                'text-foreground'
              }`}>
                {deployState}
              </p>
              {deployment && deployState !== 'ABORTED' && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Host Port: <span className="text-muted-foreground">{deployment.hostPort}</span></p>
                  <p className="text-xs text-muted-foreground">Internal Port: <span className="text-muted-foreground">{deployment.containerPort}</span></p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card title="Benchmark">
          <div className="mt-4 flex items-start gap-4">
            {benchState === 'FAILED' || benchState === 'ABORTED' ? (
              <XCircle className="text-rose-400 mt-1" size={24} />
            ) : benchState === 'COMPLETED' ? (
              <Zap className="text-emerald-400 mt-1" size={24} />
            ) : benchState !== 'PENDING' ? (
              <Zap className="text-primary mt-1" size={24} />
            ) : (
              <Zap className="text-slate-600 mt-1" size={24} />
            )}
            <div>
              <p className={`font-medium ${
                benchState === 'FAILED' || benchState === 'ABORTED' ? 'text-rose-400' :
                benchState === 'COMPLETED' ? 'text-emerald-400' :
                benchState !== 'PENDING' ? 'text-primary' :
                'text-foreground'
              }`}>
                {benchState}
              </p>
              {benchmark && benchState !== 'ABORTED' && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Total Requests: <span className="text-muted-foreground">{benchmark.totalRequests}</span></p>
                  <p className="text-xs text-muted-foreground">Workers: <span className="text-muted-foreground">{benchmark.workerCount}</span></p>
                  <p className="text-xs text-muted-foreground">Duration: <span className="text-muted-foreground">{benchmark.duration}s</span></p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Full Benchmark Metrics Table */}
      {benchmark && benchmark.status === 'COMPLETED' && (
        <Card title="Detailed Execution Metrics" className="overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div className="p-3 bg-card rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">Success</p>
              <p className="text-lg font-mono text-emerald-400">{benchmark.successCount}</p>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">Failures</p>
              <p className="text-lg font-mono text-rose-400">{benchmark.failureCount}</p>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">p50 Latency</p>
              <p className="text-lg font-mono text-amber-400">{(benchmark.p50 || 0).toFixed(2)}ms</p>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">p90 Latency</p>
              <p className="text-lg font-mono text-orange-400">{(benchmark.p90 || 0).toFixed(2)}ms</p>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">p99 Latency</p>
              <p className="text-lg font-mono text-rose-400">{(benchmark.p99 || 0).toFixed(2)}ms</p>
            </div>
          </div>
        </Card>
      )}

      {/* Score Breakdown Section */}
      {leaderboardEntry && (
        <Card title="Score Breakdown">
          <div className="flex flex-col md:flex-row gap-8 mt-4">
            <div className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground">
                The final score is calculated using the formula:
                <br />
                <code className="bg-black/30 p-1 rounded text-primary text-xs mt-2 inline-block">
                  Final Score = Correctness (50%) + TPS (30%) + Latency p99 (20%)
                </code>
              </p>
              
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Correctness Part</span>
                  <span className="font-mono text-emerald-400">+{correctnessPart.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">TPS Part (Max 20k)</span>
                  <span className="font-mono text-emerald-400">+{tpsPart.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Latency p99 Part</span>
                  <span className="font-mono text-emerald-400">+{p99Part.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-cyan-900/20 rounded-lg border border-primary">
                  <span className="text-sm font-semibold text-primary">Total Score</span>
                  <span className="font-mono font-bold text-primary">{finalScore.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center items-center bg-black/20 rounded-xl border border-border p-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Calculated Success Rate</p>
                <p className="text-4xl font-bold text-foreground">{leaderboardEntry.successRate.toFixed(1)}%</p>
                {leaderboardEntry.successRate === 0 && (
                  <p className="text-xs text-rose-400 mt-2 max-w-xs">
                    0 successes recorded during benchmark run. This severely impacts the final score.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Historical Charts */}
      {history && history.length > 0 && (
        <Card title="Historical Telemetry">
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            
            <div className="h-64">
              <p className="text-xs text-muted-foreground mb-2 text-center">TPS over Time</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#2dd4bf' }}
                  />
                  <Line type="monotone" dataKey="tps" stroke="#2dd4bf" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-64">
              <p className="text-xs text-muted-foreground mb-2 text-center">Average Latency (ms)</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fbbf24' }}
                  />
                  <Line type="monotone" dataKey="latency" stroke="#fbbf24" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>
        </Card>
      )}
    </div>
  )
}
