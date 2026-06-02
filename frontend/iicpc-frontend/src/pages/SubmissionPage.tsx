import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UploadCloud, FileCode2, Box, Server, Zap, CheckCircle, Loader2, XCircle, Clock } from 'lucide-react'
import * as submissionService from '@/services/api/submissionService'
import * as deploymentService from '@/services/api/deploymentService'
import * as benchmarkService from '@/services/api/benchmarkService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSubmissionStore } from '@/stores/useSubmissionStore'
import { useWebsocket } from '@/hooks/useWebsocket'
import { useToast } from '@/components/ui/ToastProvider'
import { fetchLeaderboardEntries } from '@/services/api/leaderboardService'

const timelineSteps = [
  { id: 'uploading', label: 'Uploaded', icon: UploadCloud, desc: 'Securely transferred submission.' },
  { id: 'building', label: 'Build Status', icon: Box, desc: 'Compiling and sandboxing.' },
  { id: 'deploying', label: 'Deployment', icon: Server, desc: 'Allocating resources on workers.' },
  { id: 'benchmarking', label: 'Benchmark', icon: Zap, desc: 'Generating distributed load.' },
  { id: 'completed', label: 'Completed', icon: CheckCircle, desc: 'Run finished successfully.' },
]

export function SubmissionPage() {
  const { user } = useAuthStore()
  const { pushToast } = useToast()
  
  
  const { activeSubmission, submissionsHistory, fetchSubmissions, updateSubmissionStatus } = useSubmissionStore()
  const [activeDeployment, setActiveDeployment] = useState<deploymentService.Deployment | null>(null)
  
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  
  

  const { latest: telemetryLatest } = useWebsocket()
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  // Fetch initial state
  useEffect(() => {
    fetchSubmissions()
    fetchLeaderboardEntries().then(data => setLeaderboard(data.items || [])).catch(console.error)
  }, [fetchSubmissions])

  // Poll for deployment related to active submission
  useEffect(() => {
    if (!activeSubmission) return

    let interval: ReturnType<typeof setInterval>

    const poll = async () => {
      try {
        const { items } = await deploymentService.listDeployments()
        const match = items.find(d => d.submissionId === activeSubmission.id)
        if (match) {
          setActiveDeployment(match)
          const status = match.deploymentStatus?.toLowerCase()
          if (status === 'failed' || status === 'stopped' || status === 'running') {
             // We can stop polling deployment once it's running or failed. 
             // Actually, if it's running, we want to know if it fails later? For MVP, we can keep polling or stop polling if a benchmark takes over.
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch deployments', err)
        clearInterval(interval)
        updateSubmissionStatus(activeSubmission.id, 'failed')
        pushToast({ title: 'Deployment Error', description: 'Failed to fetch status. Please re-upload your submission.', variant: 'error' })
      }
    }

    poll()
    interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [activeSubmission, updateSubmissionStatus, pushToast])

  const [activeBenchmark, setActiveBenchmark] = useState<any | null>(null)

  // Poll for benchmark related to active deployment
  useEffect(() => {
    if (!activeDeployment) return

    let interval: ReturnType<typeof setInterval>

    const poll = async () => {
      try {
        const { items } = await benchmarkService.fetchBenchmarkSessions()
        const match = items.find((b: any) => b.deploymentId === activeDeployment.id)
        if (match) {
          setActiveBenchmark(match)
          const status = match.status?.toLowerCase()
          if (status === 'completed' || status === 'failed' || status === 'cancelled') {
            clearInterval(interval)
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch benchmarks', err)
        clearInterval(interval)
        if (activeSubmission) {
          updateSubmissionStatus(activeSubmission.id, 'failed')
        }
        pushToast({ title: 'Benchmark Error', description: 'Failed to fetch benchmark. Please re-upload your submission.', variant: 'error' })
      }
    }

    poll()
    interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [activeDeployment, activeSubmission, updateSubmissionStatus, pushToast])

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const formData = new FormData(e.currentTarget)
    // IMPORTANT: backend expects 'teamName', but we get user.team from auth profile!
    formData.append('teamName', user.team || user.name)

    try {
      setIsUploading(true)
      await submissionService.createSubmission(formData)
      pushToast({ title: 'Success', description: 'Submission uploaded.', variant: 'success' })
      setShowUploadForm(false)
      fetchSubmissions()
    } catch (err: any) {
      pushToast({ title: 'Upload Failed', description: err.message || 'Unknown error', variant: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

	// Deprecated Manual Buttons
	// const handleDeploy = async () => { ... }
	// const handleRunBenchmark = async () => { ... }

  const getTimelineState = () => {
    let stepIndex = 0
    let isFailed = false

    if (activeSubmission) {
      stepIndex = 0 // Uploaded
      const subStatus = activeSubmission.status.toLowerCase()
      if (subStatus === 'built') stepIndex = 1
      if (subStatus === 'failed') { stepIndex = 1; isFailed = true }
      
      if (activeDeployment) {
        stepIndex = 2
        const depStatus = activeDeployment.deploymentStatus.toLowerCase()
        if (depStatus === 'running') stepIndex = 2
        if (depStatus === 'failed') { stepIndex = 2; isFailed = true }

        if (activeBenchmark) {
          stepIndex = 3
          const benchStatus = activeBenchmark.status.toLowerCase()
          if (benchStatus === 'running') stepIndex = 3
          if (benchStatus === 'failed') { stepIndex = 3; isFailed = true }
          if (benchStatus === 'completed') stepIndex = 4
        } else if (telemetryLatest && telemetryLatest.tps > 0) {
          stepIndex = 3
        }
      }
    }

    return { stepIndex, isFailed }
  }

  const { stepIndex: activeStepIndex, isFailed: hasFailed } = getTimelineState()
  
  const showActivePanel = activeSubmission != null
  const showEmptyUpload = !showActivePanel || showUploadForm

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Command Center</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Submission Management</h1>
      </div>

      <AnimatePresence mode="wait">
        {showEmptyUpload && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <Card title="Upload New Submission">
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400">Submission Name</label>
                  <input type="text" name="submissionName" required className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white outline-none focus:border-cyan-400" placeholder="e.g. baseline-engine" />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Language</label>
                  <select name="language" required className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white outline-none focus:border-cyan-400">
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Source (.zip)</label>
                  <input type="file" name="file" accept=".zip" required className="mt-1 w-full text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cyan-400 hover:file:bg-cyan-500/30" />
                </div>
                <div className="flex gap-4 mt-4">
                  <Button type="submit" className="w-full" disabled={isUploading}>
                    {isUploading ? <Loader2 className="animate-spin mx-auto" /> : 'Upload Submission'}
                  </Button>
                  {showActivePanel && (
                    <Button type="button" variant="secondary" onClick={() => setShowUploadForm(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            <div className="space-y-6">
              <Card title="Submission Guidelines" description="Ensure your code meets the platform requirements.">
                <ul className="mt-4 space-y-4 text-sm text-slate-300">
                  <li className="flex gap-3">
                    <FileCode2 className="text-violet-400" size={20} />
                    <span>Supported languages: C++, Rust, Go. Must include a Dockerfile if submitting source code.</span>
                  </li>
                  <li className="flex gap-3">
                    <Server className="text-violet-400" size={20} />
                    <span>Listens on port 8080. Accepts HTTP REST and WebSocket connections.</span>
                  </li>
                  <li className="flex gap-3">
                    <Zap className="text-violet-400" size={20} />
                    <span>Must handle massive concurrency. Bots will generate up to 20k TPS.</span>
                  </li>
                </ul>
              </Card>
            </div>
          </motion.div>
        )}

        {showActivePanel && !showUploadForm && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-white/5">
              <div>
                <p className="text-sm text-slate-400">Active Submission</p>
                <p className="text-xl font-semibold text-white">{activeSubmission.submissionName} <span className="text-xs ml-2 px-2 py-1 bg-white/10 rounded-full">{activeSubmission.language}</span></p>
              </div>
              <Button onClick={() => setShowUploadForm(true)} variant="secondary" size="sm">
                New Submission
              </Button>
            </div>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-violet-500/5" />
              <div className="relative p-6">
                <h3 className="text-lg font-semibold text-white mb-8">Pipeline Status</h3>
                
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-px bg-white/10" />

                  <div className="space-y-8">
                    {activeStepIndex === 4 ? (
                      <div className="flex flex-col items-center justify-center p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <CheckCircle className="text-emerald-400 mb-4" size={48} />
                        <h3 className="text-2xl font-bold text-white mb-2">Submission Completed ✓</h3>
                        <p className="text-emerald-200/80 mb-8 text-center max-w-md">Your submission has been successfully built, deployed, and benchmarked.</p>
                        
                        <div className="flex gap-4">
                          <Link to={`/submissions/${activeSubmission?.id}/report`}>
                            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                              View Report
                            </Button>
                          </Link>
                          <Link to={`/leaderboard/${user?.team || user?.name}`}>
                            <Button variant="secondary" className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20">
                              View Leaderboard Position
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      timelineSteps.map((step, idx) => {
                      const isPast = activeStepIndex > idx
                      const isActive = activeStepIndex === idx
                      const isError = isActive && hasFailed
                      
                      return (
                        <div key={step.id} className="relative flex items-center gap-6">
                          <div className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors ${
                            isError ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-[0_0_20px_-5px_rgba(244,63,94,0.5)]' :
                            isActive ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400 shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]' :
                            isPast ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' :
                            'border-white/10 bg-slate-900/50 text-slate-500'
                          }`}>
                            {isError ? <XCircle size={24} /> :
                             (isActive && !hasFailed && step.id !== 'uploading' && step.id !== 'completed') ? <Loader2 className="animate-spin" size={24} /> : 
                             <step.icon size={24} />}
                          </div>
                          
                          <div className={isActive ? 'opacity-100' : isPast ? 'opacity-80' : 'opacity-40'}>
                            <div className="flex items-center gap-4">
                              <p className={`text-lg font-semibold ${isError ? 'text-rose-400' : 'text-white'}`}>{step.label}</p>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{step.desc}</p>
                            
                            {/* Build Log Display */}
                            {(isActive || isPast) && step.id === 'building' && activeSubmission?.buildLog && (
                              <div className={`mt-4 p-4 rounded-lg border max-h-60 overflow-y-auto font-mono text-xs ${isError ? 'bg-rose-950/30 border-rose-500/20 text-rose-300' : 'bg-black/50 border-white/10 text-slate-300'}`}>
                                <pre className="whitespace-pre-wrap">{activeSubmission.buildLog}</pre>
                              </div>
                            )}
                            
                            {/* Live Telemetry Info if benchmarking */}
                            {isActive && step.id === 'benchmarking' && telemetryLatest && (
                              <div className="mt-4 flex gap-6 text-sm">
                                <div className="flex flex-col">
                                  <span className="text-slate-400">TPS</span>
                                  <span className="text-cyan-400 font-mono text-lg">{telemetryLatest.tps.toFixed(0)}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-slate-400">P50</span>
                                  <span className="text-emerald-400 font-mono text-lg">{(telemetryLatest.p50 / 1000000).toFixed(2)}ms</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-slate-400">P99</span>
                                  <span className="text-rose-400 font-mono text-lg">{(telemetryLatest.p99 / 1000000).toFixed(2)}ms</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-slate-400">Success</span>
                                  <span className="text-purple-400 font-mono text-lg">{((1 - telemetryLatest.failureRate) * 100).toFixed(1)}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Submission History" className="mt-8">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Language</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Rank / Score</th>
                      <th className="pb-3 font-medium">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionsHistory.map((sub) => (
                      <tr key={sub.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-4 text-white font-medium">{sub.submissionName}</td>
                        <td className="py-4">
                          <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs">{sub.language}</span>
                        </td>
                        <td className="py-4">
                           <span className={`px-2 py-1 rounded text-xs ${
                             sub.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                             sub.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                             'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                           }`}>
                             {sub.status.toUpperCase()}
                           </span>
                        </td>
                        <td className="py-4">
                          {leaderboard.find(l => l.submissionName === sub.submissionName) ? (
                            <div className="flex flex-col">
                              <span className="text-emerald-400 font-semibold">#{leaderboard.find(l => l.submissionName === sub.submissionName).rank}</span>
                              <span className="text-xs text-slate-500">Score: {leaderboard.find(l => l.submissionName === sub.submissionName).finalScore.toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-4 text-slate-400 flex items-center gap-2">
                          <Clock size={14} /> {new Date(sub.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {submissionsHistory.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          No submissions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
