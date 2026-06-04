import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UploadCloud, Box, Server, Zap, CheckCircle, Loader2, XCircle, Clock, ShieldCheck, TerminalSquare } from 'lucide-react'
import * as submissionService from '@/services/api/submissionService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSubmissionStore } from '@/stores/useSubmissionStore'
import { useToast } from '@/components/ui/ToastProvider'
import { fetchLeaderboardEntries } from '@/services/api/leaderboardService'

const timelineSteps = [
  { id: 'UPLOAD', label: 'Upload', icon: UploadCloud, desc: 'Securely transferring submission.' },
  { id: 'BUILD', label: 'Build Image', icon: Box, desc: 'Compiling and creating isolated sandbox.' },
  { id: 'DEPLOYMENT', label: 'Deployment', icon: Server, desc: 'Allocating resources on cluster.' },
  { id: 'VALIDATION', label: 'Validation', icon: ShieldCheck, desc: 'Verifying exchange endpoints.' },
  { id: 'BENCHMARK', label: 'Benchmark', icon: Zap, desc: 'Running distributed load test.' },
]

export function SubmissionPage() {
  const { user } = useAuthStore()
  const { pushToast } = useToast()
  
  const { activeSubmission, submissionsHistory, fetchSubmissions, setActiveSubmission } = useSubmissionStore()
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  const [logs, setLogs] = useState<any[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSubmissions()
    fetchLeaderboardEntries().then(data => setLeaderboard(data.items || [])).catch(console.error)
  }, [fetchSubmissions])

  // WebSocket for Logs and State Updates
  useEffect(() => {
    if (!activeSubmission?.id) return

    setLogs([])
    // We should construct the correct WS URL based on API Gateway config or direct submission-service URL
    // API Gateway proxies WebSockets, so we can use wss://<domain>/submissions/{id}/stream
    // Since we're using Vite proxy, we might connect to ws://localhost:8080/submissions/{id}/stream
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
    const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws')
    const token = useAuthStore.getState().token
    const wsUrl = `${wsBaseUrl}/submissions/${activeSubmission.id}/stream?token=${token}`
    
    const ws = new WebSocket(wsUrl)
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'log') {
        setLogs(prev => [...prev, data])
      } else if (data.type === 'state_change') {
        // Optimistically update the activeSubmission state in memory
        setActiveSubmission({
          ...activeSubmission,
          currentStage: data.stage,
          stageStatus: data.stage_status,
          failureReason: data.stage_status === 'FAILED' ? data.message : activeSubmission.failureReason,
          status: data.stage === 'BENCHMARK' && data.stage_status === 'SUCCESS' ? 'completed' : 
                  data.stage_status === 'FAILED' ? 'failed' : activeSubmission.status
        })
        fetchSubmissions()
        if (data.stage_status === 'FAILED') {
          pushToast({ title: 'Pipeline Failed', description: data.message || 'Error occurred', variant: 'error' })
        } else if (data.stage === 'BENCHMARK' && data.stage_status === 'SUCCESS') {
          pushToast({ title: 'Success', description: 'Pipeline completed successfully!', variant: 'success' })
        }
      }
    }

    ws.onerror = (err) => console.error("WebSocket error:", err)

    return () => {
      ws.close()
    }
  }, [activeSubmission?.id])

  useEffect(() => {
    // Auto-scroll logs
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const formData = new FormData(e.currentTarget)
    formData.append('teamName', user.team || user.name)

    try {
      setIsUploading(true)
      const newSub = await submissionService.createSubmission(formData)
      pushToast({ title: 'Success', description: 'Submission uploaded.', variant: 'success' })
      setShowUploadForm(false)
      setActiveSubmission(newSub)
      fetchSubmissions() // Refresh history
    } catch (err: any) {
      pushToast({ title: 'Upload Failed', description: err.message || 'Unknown error', variant: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  const getTimelineState = () => {
    let stepIndex = -1
    let isFailed = false

    if (activeSubmission) {
      const stage = activeSubmission.currentStage || 'UPLOAD'
      const status = activeSubmission.stageStatus || 'SUCCESS'
      
      stepIndex = timelineSteps.findIndex(s => s.id === stage)
      if (stepIndex === -1) stepIndex = 0 // Default to first

      if (status === 'SUCCESS') {
        // If success on current stage, visually we are waiting for next or currently on next
        stepIndex += 1
      }
      
      if (status === 'FAILED') {
        isFailed = true
      }
      
      // Safety catch if backend explicitly marks as completed
      if (activeSubmission.status === 'completed' || activeSubmission.status === 'COMPLETED') {
        stepIndex = timelineSteps.length
        isFailed = false
      }
    }

    return { stepIndex, isFailed }
  }

  const { stepIndex: activeStepIndex, isFailed: hasFailed } = getTimelineState()
  
  const showActivePanel = activeSubmission != null
  const showEmptyUpload = !showActivePanel || showUploadForm

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Command Center</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Submission Management</h1>
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
                  <label className="text-sm text-muted-foreground">Submission Name</label>
                  <input type="text" name="submissionName" required className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-foreground outline-none focus:border-primary" placeholder="e.g. baseline-engine" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Language</label>
                  <select name="language" required className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-foreground outline-none focus:border-primary">
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Source (.zip)</label>
                  <input type="file" name="file" accept=".zip" required className="mt-1 w-full text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary" />
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
              <Card title="Exchange Contract v1 Requirements" description="Your engine MUST implement the following endpoints to pass validation.">
                <ul className="mt-4 space-y-4 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <ShieldCheck className="text-emerald-400 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-semibold text-emerald-300">GET /health</p>
                      <p className="text-muted-foreground mt-1">Return HTTP 200 OK. Used by the validation stage to ensure your container is fully booted.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Zap className="text-purple-400 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-semibold text-purple-300">POST /order</p>
                      <p className="text-muted-foreground mt-1">Accepts JSON: <code className="bg-muted px-1 py-0.5 rounded">{"{ symbol, price, quantity, side }"}</code>. Must return HTTP 2xx on successful matching/logging. Bots will generate up to 20k TPS to this endpoint.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Server className="text-primary flex-shrink-0" size={20} />
                    <div>
                      <p className="font-semibold text-primary">Port 8080</p>
                      <p className="text-muted-foreground mt-1">Your web server MUST listen on port 8080, binding to 0.0.0.0.</p>
                    </div>
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
            <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border">
              <div>
                <p className="text-sm text-muted-foreground">Active Submission</p>
                <p className="text-xl font-semibold text-foreground">{activeSubmission.submissionName} <span className="text-xs ml-2 px-2 py-1 bg-muted rounded-full">{activeSubmission.language}</span></p>
              </div>
              <Button onClick={() => setShowUploadForm(true)} variant="secondary" size="sm">
                New Submission
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="relative overflow-hidden h-[600px] flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5" />
                <div className="relative p-6 flex-1 flex flex-col min-h-0">
                  <h3 className="text-lg font-semibold text-foreground mb-8 shrink-0">Pipeline Timeline</h3>
                  
                  <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar min-h-0">
                    <div className="relative">
                      <div className="absolute left-8 top-0 bottom-0 w-px bg-muted" />

                      <div className="space-y-8 pb-8">
                      {activeStepIndex === timelineSteps.length && !hasFailed ? (
                        <div className="flex flex-col items-center justify-center p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                          <CheckCircle className="text-emerald-400 mb-4" size={48} />
                          <h3 className="text-2xl font-bold text-foreground mb-2">Pipeline Completed ✓</h3>
                          <p className="text-emerald-200/80 mb-8 text-center max-w-md">Your submission has been successfully built, deployed, validated, and benchmarked.</p>
                          
                          <div className="flex gap-4">
                            <Link to={`/submissions/${activeSubmission?.id}/report`}>
                              <Button className="bg-primary hover:bg-cyan-600 text-foreground">
                                View Report
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
                            <div key={step.id} className="relative flex items-start gap-6 min-h-[5rem]">
                              <div className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors flex-shrink-0 ${
                                isError ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-[0_0_20px_-5px_rgba(244,63,94,0.5)]' :
                                isActive ? 'border-primary bg-primary text-primary shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]' :
                                isPast ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' :
                                'border-border bg-card text-foreground0'
                              }`}>
                                {isError ? <XCircle size={24} /> :
                                 (isActive && !hasFailed) ? <Loader2 className="animate-spin" size={24} /> : 
                                 isPast ? <CheckCircle size={24} /> :
                                 <step.icon size={24} />}
                              </div>
                              
                              <div className={`mt-2 ${isActive ? 'opacity-100' : isPast ? 'opacity-80' : 'opacity-40'}`}>
                                <div className="flex items-center gap-4">
                                  <p className={`text-lg font-semibold ${isError ? 'text-rose-400' : 'text-foreground'}`}>{step.label}</p>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                                
                                {isError && activeSubmission.failureReason && (
                                  <div className="mt-3 p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
                                    <p className="font-semibold mb-1">Failure Reason:</p>
                                    <p>{activeSubmission.failureReason}</p>
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
              </div>
            </Card>

              {/* Logs Panel */}
              <Card className="flex flex-col h-[600px] overflow-hidden p-0 border-border bg-[#0a0a0a]">
                <div className="bg-card p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3 text-muted-foreground font-semibold">
                    <TerminalSquare size={20} className="text-primary" />
                    <span>Live Output</span>
                  </div>
                  {activeStepIndex < timelineSteps.length && !hasFailed && (
                    <div className="flex items-center gap-2 text-xs text-primary/80">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      STREAMING
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed custom-scrollbar">
                  {logs.map((log, i) => (
                    <div key={i} className="mb-2 flex items-start gap-4 hover:bg-muted px-2 py-1 -mx-2 rounded transition-colors">
                      <span className="text-foreground0 flex-shrink-0 select-none">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className={`flex-shrink-0 w-20 text-xs font-semibold select-none ${
                        log.stage === 'BUILD' ? 'text-amber-400' :
                        log.stage === 'DEPLOYMENT' ? 'text-blue-400' :
                        log.stage === 'VALIDATION' ? 'text-purple-400' :
                        log.stage === 'BENCHMARK' ? 'text-emerald-400' : 'text-muted-foreground'
                      }`}>
                        {log.stage}
                      </span>
                      <span className={`whitespace-pre-wrap break-all ${
                        log.message?.toLowerCase().includes('failed') || log.message?.toLowerCase().includes('error') ? 'text-rose-400' :
                        log.message?.toLowerCase().includes('success') || log.message?.toLowerCase().includes('ok') ? 'text-emerald-400' :
                        'text-muted-foreground'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                  {logs.length === 0 && (
                    <div className="text-slate-600 flex h-full items-center justify-center">
                      Waiting for logs...
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card title="Submission History" className="mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Language</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Rank / Score</th>
                <th className="pb-3 font-medium">Created At</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissionsHistory.map((sub) => (
                <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-muted transition-colors">
                  <td className="py-4 text-foreground font-medium">{sub.submissionName}</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-muted border border-border rounded text-xs">{sub.language}</span>
                  </td>
                  <td className="py-4">
                     <div className="flex flex-col gap-1 items-start">
                       <span className={`px-2 py-1 rounded text-xs ${
                         sub.status.toLowerCase() === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                         sub.status.toLowerCase() === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                         'bg-primary text-primary border border-primary'
                       }`}>
                         {sub.status.toUpperCase()}
                       </span>
                       {sub.status === 'failed' && sub.failureReason && (
                         <span className="text-[10px] text-rose-400/80 max-w-xs truncate" title={sub.failureReason}>
                           {sub.failureReason}
                         </span>
                       )}
                     </div>
                  </td>
                  <td className="py-4">
                    {leaderboard.find(l => l.submissionName === sub.submissionName) ? (
                      <div className="flex flex-col">
                        <span className="text-emerald-400 font-semibold">#{leaderboard.find(l => l.submissionName === sub.submissionName).rank}</span>
                        <span className="text-xs text-foreground0">Score: {leaderboard.find(l => l.submissionName === sub.submissionName).finalScore.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-foreground0">-</span>
                    )}
                  </td>
                  <td className="py-4 text-muted-foreground flex items-center gap-2">
                    <Clock size={14} /> {new Date(sub.createdAt).toLocaleString()}
                  </td>
                  <td className="py-4 text-right">
                    <Link to={`/submissions/${sub.id}/report`}>
                      <Button variant="secondary" size="sm" className="bg-muted hover:bg-muted text-primary border-border">
                        View Report
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {submissionsHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-foreground0">
                    No submissions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
