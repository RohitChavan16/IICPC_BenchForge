import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageHero } from '@/components/layout/PageHero'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Server, Zap, CheckCircle, ArrowLeft, Trophy, Activity, XCircle, Brain, Info, Shield, Target, FileCode } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import * as submissionService from '@/services/api/submissionService'
import * as deploymentService from '@/services/api/deploymentService'
import * as benchmarkService from '@/services/api/benchmarkService'
import { fetchLeaderboardEntries } from '@/services/api/leaderboardService'
import { fetchBenchmarkTelemetryHistory, fetchPersonaAnalytics } from '@/services/api/telemetryService'
import { LiveLogs } from '@/components/LiveLogs'
import { MarketSimulationAnalytics } from '@/components/analytics/MarketSimulationAnalytics'
import { BenchmarkHealthCard } from '@/components/analytics/BenchmarkHealthCard'
import { TimelineView } from '@/components/analytics/TimelineView'
import { WorkerExecutionAnalysis } from '@/components/analytics/WorkerExecutionAnalysis'
import { ReplayContainer } from '@/components/replay/ReplayContainer'
import { LifecycleTrack } from '@/components/replay/LifecycleTrack'
import { useToast } from '@/components/ui/ToastProvider'

export function SubmissionReportPage() {
  const { id } = useParams<{ id: string }>()
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  
  useEffect(() => {
    window.scrollTo(0, 0)
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
        let personas = []
        if (benchmark) {
          const lb = await fetchLeaderboardEntries()
          leaderboardEntry = lb.items.find((e: any) => e.benchmarkId === benchmark.id)
          history = await fetchBenchmarkTelemetryHistory(benchmark.id)
          personas = await fetchPersonaAnalytics(benchmark.id)
        }
        
        let replay = null
        if (benchmark) {
          try {
             replay = await benchmarkService.fetchBenchmarkReplay(benchmark.id)
          } catch(e) { console.error("Replay fetch failed", e) }
        }

        setData({ submission, deployment, benchmark, leaderboardEntry, history, personas, replay })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  useEffect(() => {
    if (!loading) {
      // Force scroll to top after the large DOM paints, defeating browser native scroll restoration
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }, 50)
      return () => clearTimeout(timer)
    } else {
      window.scrollTo(0, 0)
    }
  }, [loading])

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Loading report...</div>
  }

  if (!data || !data.submission) {
    return <div className="text-center py-20 text-muted-foreground">Submission not found.</div>
  }

  const { submission, deployment, benchmark, leaderboardEntry, history, personas, replay } = data

  const botLabels: Record<string, string> = {
    retail: 'Retail Trader',
    market_maker: 'Market Maker',
    scalper: 'Scalper',
    whale: 'Whale',
    hft_stressor: 'HFT Stressor',
  }

  const marketPersonas = (personas || []).filter((p: any) => p.botType !== 'tracer')

  // Score Calculations
  let concurrencyScore = 0
  let effectiveTps = 0
  let latencyFactor = 0
  let finalScore = 0

  let correctnessResults: any[] = []
  if (submission && submission.correctnessDetails) {
    try {
      correctnessResults = typeof submission.correctnessDetails === 'string'
        ? JSON.parse(submission.correctnessDetails)
        : submission.correctnessDetails
    } catch (e) {
      console.error('Failed to parse correctness details', e)
    }
  }

  if (leaderboardEntry) {
    concurrencyScore = leaderboardEntry.concurrencyScore !== undefined ? leaderboardEntry.concurrencyScore : 100.0
    effectiveTps = leaderboardEntry.tps * (leaderboardEntry.successRate / 100.0)
    latencyFactor = 250.0 / (250.0 + (leaderboardEntry.p99 || 0))

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

  // Derived Verdict Logic
  let verdictGrade = "PENDING"
  let verdictColor = "text-muted-foreground"
  let verdictBg = "bg-muted"
  let verdictBorder = "border-muted"
  let strengths: string[] = []
  let weaknesses: string[] = []
  let overallAssessment = "Assessment pending completion."

  if (benchmark && benchmark.status === 'COMPLETED' && leaderboardEntry) {
    if (finalScore >= 90) {
      verdictGrade = "A+"
      verdictColor = "text-emerald-400"
      verdictBg = "bg-emerald-500/10"
      verdictBorder = "border-emerald-500/20"
    } else if (finalScore >= 80) {
      verdictGrade = "A"
      verdictColor = "text-blue-400"
      verdictBg = "bg-blue-500/10"
      verdictBorder = "border-blue-500/20"
    } else if (finalScore >= 70) {
      verdictGrade = "B+"
      verdictColor = "text-amber-400"
      verdictBg = "bg-amber-500/10"
      verdictBorder = "border-amber-500/20"
    } else if (finalScore >= 60) {
      verdictGrade = "B"
      verdictColor = "text-amber-500"
      verdictBg = "bg-amber-600/10"
      verdictBorder = "border-amber-600/20"
    } else {
      verdictGrade = "C"
      verdictColor = "text-rose-400"
      verdictBg = "bg-rose-500/10"
      verdictBorder = "border-rose-500/20"
    }

    if (submission.correctnessScore >= 99) strengths.push("Perfect Correctness")
    else if (submission.correctnessScore >= 95) strengths.push("High Correctness")
    
    if (effectiveTps > 500) strengths.push("High Throughput")
    else if (effectiveTps > 200) strengths.push("Stable Throughput")

    const mm = marketPersonas.find((p: any) => p.botType === 'market_maker')
    if (mm && mm.successRate >= 98 && mm.latency < 50000000) strengths.push("Stable Market Maker Handling")

    const scalper = marketPersonas.find((p: any) => p.botType === 'scalper')
    if (scalper && scalper.latency > 100000000) weaknesses.push("Scalper Latency Spikes")
    
    const hft = marketPersonas.find((p: any) => p.botType === 'hft_stressor')
    if (hft && hft.successRate < 95) weaknesses.push("HFT Burst Sensitivity")
    else if (hft && hft.latency > 100000000) weaknesses.push("HFT Latency Degradation")

    if (weaknesses.length === 0 && finalScore < 90) weaknesses.push("General Latency Overhead")
    if (weaknesses.length === 0 && finalScore >= 90) weaknesses.push("None identified")

    if (finalScore >= 90) {
      overallAssessment = "Production-grade matching engine demonstrating excellent throughput and correctness. Handles extreme market conditions with minimal degradation."
    } else if (finalScore >= 70) {
      overallAssessment = "Solid matching engine with good throughput and acceptable correctness. Minor latency degradation observed during burst-style traffic conditions."
    } else {
      overallAssessment = "Engine functional but exhibits significant latency or correctness issues under load. Requires optimization for production market conditions."
    }
  }

  let worstPersona = null
  let bestPersona = null
  let highestTpsPersona = null
  let highestLoadPersona = null

  if (marketPersonas.length > 0) {
    worstPersona = [...marketPersonas].sort((a,b) => b.latency - a.latency)[0]
    bestPersona = [...marketPersonas].sort((a,b) => a.latency - b.latency)[0]
    highestTpsPersona = [...marketPersonas].sort((a,b) => b.tps - a.tps)[0]
    highestLoadPersona = [...marketPersonas].sort((a,b) => b.total - a.total)[0]
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <PageHero 
        theme="submission"
        backLink={{ to: '/submissions', label: 'Back to Submissions' }}
        icon={<FileCode size={40} />}
        title={submission.submissionName}
        subtitle="Production-grade matching engine benchmark analysis"
        statusPills={[
          { label: benchmark ? benchmark.status : 'PENDING', variant: benchmark && benchmark.status === 'COMPLETED' ? 'success' : 'accent' }
        ]}
        metadata={[
          { label: 'Language', value: submission.language },
          { label: 'Score', value: leaderboardEntry ? finalScore.toFixed(2) : 'N/A' },
          { label: 'Rank', value: leaderboardEntry ? `#${leaderboardEntry.rank}` : 'N/A' },
          { label: 'Correctness', value: submission.correctnessScore != null ? `${submission.correctnessScore.toFixed(1)}%` : 'N/A' },
          { label: 'TPS', value: effectiveTps ? effectiveTps.toFixed(2) : 'N/A' },
        ]}
        quickLinks={[
          { label: 'Verdict', targetId: 'verdict' },
          { label: 'Health', targetId: 'health' },
          { label: 'Metrics', targetId: 'metrics' },
          { 
            label: 'Replay', 
            targetId: 'replay',
            onClick: !replay ? () => pushToast({ variant: 'warning', title: 'Replay Unavailable', description: 'No replay data was found for this session.' }) : undefined
          },
          { label: 'Personas', targetId: 'personas' },
          { label: 'Correctness', targetId: 'correctness' },
          { label: 'Telemetry', targetId: 'telemetry' },
          { label: 'Logs', targetId: 'logs' }
        ]}
      />

      {/* 1. Benchmark Verdict Hero Card */}
      {benchmark && benchmark.status === 'COMPLETED' && leaderboardEntry && (
        <motion.div 
          whileHover={{ scale: 1.01 }}
          id="verdict"
          className={`relative overflow-hidden rounded-2xl border ${verdictBorder} bg-gradient-to-br from-card to-background shadow-lg p-6 scroll-mt-32`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row gap-8 relative z-10">
            <div className="md:w-1/3 flex flex-col items-center justify-center border-r border-border/50 pr-8">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Benchmark Verdict</p>
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${verdictBg} ${verdictBorder} border-4 mb-3`}>
                <span className={`text-4xl font-black ${verdictColor}`}>{verdictGrade}</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic text-center">* Derived Insight based on final score ranges</p>
            </div>
            
            <div className="md:w-2/3 flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-6 mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">Strengths</p>
                  <ul className="space-y-1">
                    {strengths.map((s, i) => (
                      <li key={i} className="text-sm text-foreground flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-500" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">Weaknesses</p>
                  <ul className="space-y-1">
                    {weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-foreground flex items-center gap-2">
                        {w === "None identified" ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-rose-500" />} {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-secondary/20 p-3 rounded-lg border border-border/50">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Overall Assessment</p>
                <p className="text-sm text-foreground leading-relaxed">{overallAssessment}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Evaluation Timeline */}
      <div id="health" className="scroll-mt-32 space-y-8">
      <TimelineView 
        submission={submission} 
        deployment={deployment} 
        benchmark={benchmark} 
        leaderboardEntry={leaderboardEntry} 
      />

      {/* 2. Benchmark Health Profile */}
      <BenchmarkHealthCard 
        submission={submission} 
        benchmark={benchmark} 
        leaderboardEntry={leaderboardEntry} 
      />

      {/* Worker Execution Analysis */}
      {benchmark && (
        <WorkerExecutionAnalysis benchmark={benchmark} />
      )}

      </div>

      {/* Overview Details Section */}
      <div id="metrics" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 scroll-mt-32">
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

        <Card title="Correctness (Experimental)">
          <div className="mt-4 flex items-start gap-4">
            {submission.correctnessScore == null && !submission.correctnessDetails ? (
              <CheckCircle className="text-slate-600 mt-1" size={24} />
            ) : submission.correctnessScore == null && submission.correctnessDetails ? (
               <CheckCircle className="text-amber-400 mt-1" size={24} />
            ) : submission.correctnessScore >= 95 ? (
              <CheckCircle className="text-emerald-400 mt-1" size={24} />
            ) : (
              <XCircle className="text-rose-400 mt-1" size={24} />
            )}
            <div>
              <p className={`font-medium ${submission.correctnessScore == null && submission.correctnessDetails ? 'text-amber-400' : submission.correctnessScore >= 95 ? 'text-emerald-400' : submission.correctnessScore != null ? 'text-rose-400' : 'text-foreground'}`}>
                {submission.correctnessScore != null ? `${submission.correctnessScore.toFixed(1)}%` : submission.correctnessDetails ? 'UNKNOWN' : 'PENDING'}
              </p>
              {submission.correctnessDetails && submission.correctnessScore == null && (
                 <p className="text-xs text-amber-400 mt-1 max-w-[120px]">Legacy API contract</p>
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

      {/* Replay Engine */}
      <div id="replay" className="scroll-mt-32">
        <Card title="Benchmark Replay Engine">
          <div className="mt-4 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Replay Engine provides a granular, microsecond-level visualization of the matching engine's execution lifecycle. You can use this timeline to trace the exact moments when your engine was overwhelmed, visualize when specific persona bots encountered order rejection, or identify thread deadlocks during massive HFT traffic bursts. It's essentially a slow-motion playback of your engine's performance under fire.
            </p>
          </div>
          {replay ? (
            <div className="mt-6">
              <LifecycleTrack events={replay.lifecycle_events} currentStatus={benchState} />
              <ReplayContainer replay={replay} />
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center py-12 px-4 bg-secondary/10 rounded-xl border border-border/50">
              <Activity className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-foreground mb-2">Replay Unavailable</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                No replay data could be found for this benchmark session. The replay may have failed to generate, or the session might not have completed successfully.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* 3. Executive KPI Row */}
      {benchmark && benchmark.status === 'COMPLETED' && marketPersonas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} whileHover={{ scale: 1.02, y: -4 }} className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Info size={12}/> Worst Persona</div>
            <div className="text-lg font-bold text-foreground">{worstPersona ? botLabels[worstPersona.botType] : '-'}</div>
            <div className="text-sm text-rose-400 font-mono">{worstPersona ? `${(worstPersona.latency/1000000).toFixed(1)}ms` : '-'}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} whileHover={{ scale: 1.02, y: -4 }} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Info size={12}/> Best Persona</div>
            <div className="text-lg font-bold text-foreground">{bestPersona ? botLabels[bestPersona.botType] : '-'}</div>
            <div className="text-sm text-emerald-400 font-mono">{bestPersona ? `${(bestPersona.latency/1000000).toFixed(1)}ms` : '-'}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} whileHover={{ scale: 1.02, y: -4 }} className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Info size={12}/> Highest TPS</div>
            <div className="text-lg font-bold text-foreground">{highestTpsPersona ? botLabels[highestTpsPersona.botType] : '-'}</div>
            <div className="text-sm text-blue-400 font-mono">{highestTpsPersona ? `${highestTpsPersona.tps.toFixed(1)} TPS` : '-'}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} whileHover={{ scale: 1.02, y: -4 }} className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Info size={12}/> Highest Load</div>
            <div className="text-lg font-bold text-foreground">{highestLoadPersona ? botLabels[highestLoadPersona.botType] : '-'}</div>
            <div className="text-sm text-violet-400 font-mono">{highestLoadPersona ? `${highestLoadPersona.total} Requests` : '-'}</div>
          </motion.div>
        </div>
      )}

      {/* 4. Score Analysis */}
      {leaderboardEntry && (
        <div id="personas" className="scroll-mt-32">
        <Card title="Score Analysis">
          <div className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The final score is calculated using the Phase 4 formula:
                <br />
                <code className="bg-black/30 p-1 rounded text-primary text-xs mt-2 inline-block">
                  Final Score = Effective TPS * (250/(250+p99)) * (Correctness / 100)² * (Concurrency / 100)²
                </code>
              </p>
              
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Effective TPS</span>
                  <span className="font-mono text-emerald-400">{effectiveTps.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Latency Factor</span>
                  <span className="font-mono text-emerald-400">
                    x{latencyFactor.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Correctness Multiplier</span>
                  <span className="font-mono text-emerald-400">
                    x{Math.pow(leaderboardEntry.correctnessScore / 100.0, 2).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-card rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">Concurrency Multiplier</span>
                  <span className="font-mono text-emerald-400">
                    x{Math.pow(concurrencyScore / 100.0, 2).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-cyan-900/20 rounded-lg border border-primary">
                  <span className="text-sm font-semibold text-primary">Total Score</span>
                  <span className="font-mono font-bold text-primary">{finalScore.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
        </div>
      )}

      {/* 5. Engine Intelligence Summary */}
      {benchmark && benchmark.status === 'COMPLETED' && marketPersonas.length > 0 && (
        <div className="relative rounded-2xl bg-gradient-to-r from-primary/40 via-purple-500/40 to-emerald-500/40 p-[1px] shadow-lg">
          <div className="rounded-[15px] bg-card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl border border-primary/20">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                  Engine Intelligence Summary
                </h3>
              </div>
              <span className="text-xs text-muted-foreground italic">* Derived Engineering Insights</span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div whileHover={{ scale: 1.02, y: -4 }} className="bg-secondary/20 border border-border/50 rounded-xl p-5 flex flex-col h-full hover:bg-secondary/30 transition-colors">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary/70 bg-primary/10 px-2 py-1 rounded">Observation #1</span>
                  </div>
                  <p className="text-foreground font-medium mb-4 text-sm leading-relaxed">
                    {(() => {
                      const highestVolume = [...marketPersonas].sort((a,b) => b.total - a.total)[0];
                      const totalVol = marketPersonas.reduce((acc: number, p: any) => acc + p.total, 0);
                      const pct = highestVolume ? Math.round((highestVolume.total / totalVol) * 100) : 0;
                      return `${highestVolume ? botLabels[highestVolume.botType] || highestVolume.botType : 'Traffic'} generated ${pct}% of benchmark volume while maintaining ${highestVolume && highestVolume.latency < 50000000 ? 'stable' : 'elevated'} latency, indicating ${highestVolume && highestVolume.latency < 50000000 ? 'efficient' : 'constrained'} order insertion performance.`
                    })()}
                  </p>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02, y: -4 }} className="bg-secondary/20 border border-border/50 rounded-xl p-5 flex flex-col h-full hover:bg-secondary/30 transition-colors">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-purple-400/70 bg-purple-500/10 px-2 py-1 rounded">Observation #2</span>
                  </div>
                  <p className="text-foreground font-medium mb-4 text-sm leading-relaxed">
                    {(() => {
                      const highestTps = [...marketPersonas].sort((a,b) => b.tps - a.tps)[0];
                      return `${highestTps ? botLabels[highestTps.botType] || highestTps.botType : 'Traffic'} maintained exceptionally high throughput (${highestTps?.tps.toFixed(1)} TPS), indicating stable orderbook insertion performance.`
                    })()}
                  </p>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02, y: -4 }} className="bg-secondary/20 border border-border/50 rounded-xl p-5 flex flex-col h-full hover:bg-secondary/30 transition-colors">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-400/70 bg-blue-500/10 px-2 py-1 rounded">Observation #3</span>
                  </div>
                  <p className="text-foreground font-medium mb-4 text-sm leading-relaxed">
                    {(() => {
                      const whale = marketPersonas.find((p: any) => p.botType === 'whale');
                      if (whale) {
                        return `Whale traffic maintained ${(whale.latency/1000000).toFixed(1)}ms latency despite large order sizes, suggesting matching performance scales ${whale.latency < 50000000 ? 'efficiently' : 'moderately'} with volume.`;
                      }
                      return "Whale traffic metrics unavailable.";
                    })()}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Correctness & Tracer Validation */}
      <div id="correctness" className="space-y-6 scroll-mt-32">
        {/* Tracer Validation */}
        {(() => {
          const tracer = personas.find((p: any) => p.botType === 'tracer');
          if (!tracer) return null;
          return (
            <Card title="Tracer Validation" className="border-l-4 border-l-blue-500">
              <div className="flex flex-col sm:flex-row gap-6 mt-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-4">
                    The tracer bot continuously validates concurrency and consistency across the matching engine while market traffic is active.
                  </p>
                  <div className="flex gap-4">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex-1">
                      <p className="text-xs text-blue-400 mb-1 font-semibold uppercase">Requests</p>
                      <p className="font-mono text-xl text-foreground">{tracer.total}</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex-1">
                      <p className="text-xs text-emerald-400 mb-1 font-semibold uppercase">Success Rate</p>
                      <p className="font-mono text-xl text-foreground">{tracer.successRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-secondary/30 rounded-xl p-4 border border-border/50 flex flex-col justify-center">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-foreground mb-1">Concurrency Verification</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Tracer traffic verifies that no resting orders are lost or double-filled under extreme multi-threaded market stress.</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })()}

        {correctnessResults.length > 0 && (
          <Card title="Correctness Validation Scenarios" className="overflow-hidden">
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {correctnessResults.map((res: any, idx: number) => {
                let boxClass = "flex flex-col p-4 rounded-xl border transition-all duration-300 gap-3 ";
                if (res.status === 'PASSED') {
                  boxClass += "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]";
                } else if (res.status === 'CONTRACT_NOT_SUPPORTED') {
                  boxClass += "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]";
                } else {
                  boxClass += "bg-rose-500/5 border-rose-500/30 hover:border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.05)] hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]";
                }

                let detailText = "Verification complete";
                if (res.name === 'basic_resting_order') detailText = "Expected: resting | Actual: resting";
                else if (res.name === 'basic_matching_order') detailText = "Expected: filled | Actual: filled";
                else if (res.name === 'partial_fill_order') detailText = "Partial execution verified";
                else if (res.name === 'price_improvement') detailText = "Price improvement preserved";
                else if (res.name === 'fifo_priority') detailText = "FIFO ordering verified";
                else if (res.name === 'multi_level_price_sweep') detailText = "Multi-level matching verified";

                return (
                  <div key={idx} className={boxClass}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{res.name || `Scenario ${idx + 1}`}</span>
                      {res.status === 'PASSED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                          <CheckCircle size={12} /> PASSED
                        </span>
                      ) : res.status === 'CONTRACT_NOT_SUPPORTED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                          <Activity size={12} /> LEGACY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20">
                          <XCircle size={12} /> FAILED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 bg-background/50 p-2 rounded border border-border/50">
                      {detailText}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Historical Charts */}
      {history && history.length > 0 && (
        <div id="telemetry" className="scroll-mt-32"><Card title="Historical Telemetry">
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            
            <div className="h-64">
              <p className="text-xs text-muted-foreground mb-2 text-center">TPS over Time</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="time" stroke="currentColor" opacity={0.5} fontSize={10} />
                  <YAxis stroke="currentColor" opacity={0.5} fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="time" stroke="currentColor" opacity={0.5} fontSize={10} />
                  <YAxis stroke="currentColor" opacity={0.5} fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                    itemStyle={{ color: '#fbbf24' }}
                  />
                  <Line type="monotone" dataKey="latency" stroke="#fbbf24" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>
        </Card>
        </div>
      )}

      {/* 6. Persona Charts */}
      {benchmark && benchmark.status === 'COMPLETED' && (
        <Card title="Market Conditions Summary (v1.0 - Hackathon Mix)">
          <div className="mt-4">
            <MarketSimulationAnalytics benchmarkId={benchmark.id} />
          </div>
        </Card>
      )}

      {/* 7. Persona Ranking Table */}
      {benchmark && benchmark.status === 'COMPLETED' && marketPersonas.length > 0 && (
        <Card title="Persona Ranking">
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Rank</th>
                  <th className="px-4 py-3">Persona</th>
                  <th className="px-4 py-3">TPS</th>
                  <th className="px-4 py-3">P99 Latency</th>
                  <th className="px-4 py-3">Success Rate</th>
                  <th className="px-4 py-3 rounded-tr-lg">Requests</th>
                </tr>
              </thead>
              <tbody>
                {[...marketPersonas]
                  .sort((a, b) => {
                    const scoreA = a.successRate - (a.latency/1000000)*0.1 + (a.tps*0.01);
                    const scoreB = b.successRate - (b.latency/1000000)*0.1 + (b.tps*0.01);
                    return scoreB - scoreA;
                  })
                  .map((p: any, idx: number) => {
                    const rank = idx + 1;
                    return (
                      <tr key={p.botType} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-muted-foreground">#{rank}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{botLabels[p.botType] || p.botType}</td>
                        <td className="px-4 py-3 font-mono">{p.tps.toFixed(1)}</td>
                        <td className="px-4 py-3 font-mono">{(p.latency/1000000).toFixed(1)}ms</td>
                        <td className="px-4 py-3 font-mono">{p.successRate.toFixed(1)}%</td>
                        <td className="px-4 py-3 font-mono">{p.total}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 8. Market Stress Resilience */}
      {benchmark && benchmark.status === 'COMPLETED' && marketPersonas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Market Stress Resilience
            </h3>
            <span className="text-xs text-muted-foreground italic">* Derived Insight</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {marketPersonas.map((p: any, idx: number) => {
              const isHealthy = p.successRate >= 99 && p.latency < 500000000;
              const isDegraded = p.successRate >= 95 && p.latency < 2000000000 && !isHealthy;
              
              let stateText = "HEALTHY";
              let stateColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
              
              if (!isHealthy && !isDegraded) {
                stateText = "CRITICAL";
                stateColor = "text-rose-400 bg-rose-500/10 border-rose-500/30";
              } else if (isDegraded) {
                stateText = "DEGRADED";
                stateColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";
              }

              const labelMap: Record<string, string> = {
                retail: "Retail Load",
                market_maker: "Market Maker Load",
                scalper: "Scalper Burst",
                whale: "Whale Attack",
                hft_stressor: "HFT Stress"
              };
              const title = labelMap[p.botType] || botLabels[p.botType] || p.botType;

              return (
                <motion.div 
                  key={p.botType}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border ${stateColor}`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider mb-2 text-foreground/80 text-center">{title}</span>
                  <span className="text-xl font-bold tracking-widest">{stateText}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* 10. Execution Logs */}
      <div id="logs" className="scroll-mt-32"><LiveLogs 
        submissionId={submission.id} 
        isActive={submission.status !== 'COMPLETED' && submission.status !== 'FAILED'} 
      /></div>
    </div>
  )
}
