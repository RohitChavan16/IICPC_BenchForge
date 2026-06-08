import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHero } from '@/components/layout/PageHero'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UploadCloud, Box, Server, Zap, CheckCircle, Loader2, XCircle, Clock, ShieldCheck, TerminalSquare, FileArchive, ChevronDown, ChevronUp, Trophy, Activity } from 'lucide-react'
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
  const location = useLocation()
  const navigate = useNavigate()
  
  const isSubmitRoute = location.pathname === '/submit'
  
  const { activeSubmission, submissionsHistory, fetchSubmissions, setActiveSubmission } = useSubmissionStore()
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('go')
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [isPipelineExpanded, setIsPipelineExpanded] = useState(true)
  const [isLogsExpanded, setIsLogsExpanded] = useState(true)

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
      setSelectedFileName('')
      setActiveSubmission(newSub)
      fetchSubmissions() // Refresh history
      if (isSubmitRoute) {
        navigate('/submissions')
      }
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
  const isSubmissionOver = (activeStepIndex === timelineSteps.length && !hasFailed) || hasFailed
  
  const showActivePanel = activeSubmission != null && !isSubmitRoute
  const showEmptyUpload = isSubmitRoute || activeSubmission == null || showUploadForm

  const totalSubmissions = submissionsHistory.length;
  const totalCompleted = submissionsHistory.filter(s => s.status.toLowerCase() === 'completed').length;
  const totalFailed = submissionsHistory.filter(s => s.status.toLowerCase() === 'failed').length;
  const currentRunning = submissionsHistory.filter(s => !['completed', 'failed'].includes(s.status.toLowerCase())).length;
  const bestScore = leaderboard.length > 0 ? Math.max(...leaderboard.map(l => l.finalScore)).toFixed(2) : 'N/A';
  const worstScore = leaderboard.length > 0 ? Math.min(...leaderboard.map(l => l.finalScore)).toFixed(2) : 'N/A';

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHero 
        theme={isSubmitRoute ? "dashboard" : "history"}
        icon={<TerminalSquare size={40} />}
        title={isSubmitRoute ? "Submit Code" : "Submission History"}
        subtitle={isSubmitRoute 
          ? "Upload your engine source code and deploy to the cluster for correctness validation and high-frequency benchmarking."
          : "Command Center for Code Execution, Verification, and Historical Analytics. Review your past deployments, monitor active builds, and confidently deploy new engine iterations to the evaluation cluster."}
        statusPills={[
          { label: activeSubmission ? 'Active' : 'Awaiting', variant: activeSubmission ? 'success' : 'info' }
        ]}
        metadata={isSubmitRoute ? [
          { label: 'Instruction', value: '3 Steps', icon: <Box size={14} /> },
          { label: 'History', value: totalSubmissions, icon: <FileArchive size={14} /> },
          { label: 'Current Running', value: currentRunning, icon: <Zap size={14} /> },
          { label: 'Success', value: totalCompleted, icon: <CheckCircle size={14} /> },
          { label: 'Failed', value: totalFailed, icon: <XCircle size={14} /> }
        ] : [
          { label: 'Total Entries', value: totalSubmissions, icon: <FileArchive size={14} /> },
          { label: 'Completed', value: totalCompleted, icon: <CheckCircle size={14} /> },
          { label: 'Failed', value: totalFailed, icon: <XCircle size={14} /> },
          { label: 'Best Score', value: bestScore, icon: <Trophy size={14} /> },
          { label: 'Worst Score', value: worstScore, icon: <Activity size={14} /> }
        ]}
      />

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
                  <div className="flex gap-3 mt-1">
                    {['go', 'rust', 'cpp'].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                          selectedLanguage === lang
                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                            : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground'
                        }`}
                      >
                        {lang === 'go' ? 'Go' : lang === 'rust' ? 'Rust' : 'C++'}
                      </button>
                    ))}
                    <input type="hidden" name="language" value={selectedLanguage} />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Source (.zip)</label>
                  <div className="mt-1 flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center">
                    <input
                      id="submission-source-file"
                      type="file"
                      name="file"
                      accept=".zip"
                      required
                      className="sr-only"
                      onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? '')}
                    />
                    <label
                      htmlFor="submission-source-file"
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                    >
                      <UploadCloud size={18} />
                      Choose File
                    </label>
                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                      <FileArchive size={18} className="shrink-0 text-muted-foreground" />
                      <span
                        className={selectedFileName ? 'truncate font-medium text-foreground' : 'text-muted-foreground'}
                        title={selectedFileName || 'No file chosen'}
                      >
                        {selectedFileName || 'No file chosen'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <Button type="submit" className="w-full" disabled={isUploading}>
                    {isUploading ? <Loader2 className="animate-spin mx-auto" /> : 'Upload Submission'}
                  </Button>
                  {showActivePanel && (
                    <Button type="button" variant="secondary" onClick={() => navigate('/submissions')}>
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
            <div 
              className={`flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-4 rounded-2xl border ${isSubmissionOver ? (activeSubmission.status.toLowerCase() === 'completed' ? 'border-emerald-500/30 bg-emerald-500/5' : activeSubmission.status.toLowerCase() === 'failed' ? 'border-rose-500/30 bg-rose-500/5' : 'border-border') : 'border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)]'} ${isSubmissionOver ? 'cursor-pointer hover:bg-muted/30 transition-colors' : ''}`}
              onClick={() => isSubmissionOver && setIsPipelineExpanded(!isPipelineExpanded)}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">{isSubmissionOver ? 'Previous Submission' : 'Active Submission'}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold text-foreground">{activeSubmission.submissionName}</p>
                    <span className="text-xs px-2 py-1 bg-muted rounded-full font-medium border border-border">{activeSubmission.language}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase border ${
                      activeSubmission.status.toLowerCase() === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                      activeSubmission.status.toLowerCase() === 'failed' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' :
                      'bg-primary/10 text-primary border-primary/30'
                    }`}>
                      {activeSubmission.status}
                    </span>
                  </div>
                </div>
                {isSubmissionOver && leaderboard.find(l => l.submissionId === activeSubmission.id) && (
                  <div className="hidden md:flex items-center gap-4 border-l border-border pl-6">
                    <div className="flex flex-col items-center justify-center px-4 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 min-w-[70px] shadow-sm">
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 uppercase tracking-wider font-bold mb-0.5">Rank</p>
                      <p className="text-lg leading-none font-bold text-amber-800 dark:text-amber-300">#{leaderboard.find(l => l.submissionId === activeSubmission.id)?.rank}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center px-4 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 min-w-[70px] shadow-sm">
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-bold mb-0.5">Score</p>
                      <p className="text-lg leading-none font-bold text-emerald-800 dark:text-emerald-300">{leaderboard.find(l => l.submissionId === activeSubmission.id)?.finalScore.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto">
                <Button onClick={(e) => { e.stopPropagation(); navigate('/submit'); }} variant="secondary" size="sm" className="w-full md:w-auto">
                  New Submission
                </Button>
                {isSubmissionOver && (
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/50 text-sm font-semibold text-muted-foreground transition-colors shadow-sm">
                    {isPipelineExpanded ? 'Hide Details' : 'View Details'}
                    {isPipelineExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {(!isSubmissionOver || isPipelineExpanded) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid gap-6 lg:grid-cols-2 items-start overflow-hidden"
                >
              <Card className="relative overflow-hidden flex flex-col transition-all duration-300 h-[600px]">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5" />
                <div className="relative p-6 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between shrink-0 mb-8">
                    <h3 className="text-lg font-semibold text-foreground">Pipeline Timeline</h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar min-h-0 mt-4">
                    <div className="relative">
                      <div className="absolute left-8 top-0 bottom-0 w-px bg-muted" />

                      <div className="space-y-8 pb-8">
                      {activeStepIndex === timelineSteps.length && !hasFailed ? (
                        <div className="flex flex-col items-center justify-center p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                          <CheckCircle className="text-emerald-400 mb-4" size={48} />
                          <h3 className="text-2xl font-bold text-foreground mb-2">Pipeline Completed ✓</h3>
                          <p className="text-emerald-700 dark:text-emerald-200/80 mb-8 text-center max-w-md">Your submission has been successfully built, deployed, validated, and benchmarked.</p>
                          
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
                                  isActive ? 'border-primary bg-primary/20 text-primary shadow-[0_0_20px_-5px_var(--primary)]' :
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
              <Card className="flex flex-col overflow-hidden p-0 border-border bg-[#0a0a0a] transition-all duration-300 h-[600px]">
                <div className="bg-card p-4 flex items-center justify-between border-b border-border">
                  <div className="flex items-center gap-3 text-muted-foreground font-semibold">
                    <TerminalSquare size={20} className="text-primary" />
                    <span>Live Output</span>
                  </div>
                  <div className="flex items-center gap-4">
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
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed custom-scrollbar">
                  {logs.map((log, i) => (
                    <div key={i} className="mb-2 flex items-start gap-4 hover:bg-muted px-2 py-1 -mx-2 rounded transition-colors">
                      <span className="text-foreground0 flex-shrink-0 select-none min-w-[100px]">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className={`flex-shrink-0 w-32 truncate text-xs font-semibold select-none ${
                        log.stage === 'BUILD' ? 'text-amber-400' :
                        log.stage === 'DEPLOYMENT' ? 'text-blue-400' :
                        log.stage === 'VALIDATION' ? 'text-purple-400' :
                        log.stage === 'VALIDATING_CORRECTNESS' ? 'text-cyan-400' :
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
              </motion.div>
            )}
            </AnimatePresence>
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
                         'bg-primary/10 text-primary border border-primary/20'
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
                    {leaderboard.find(l => l.submissionId === sub.id) ? (
                      <div className="flex flex-col">
                        <span className="text-emerald-400 font-semibold">#{leaderboard.find(l => l.submissionId === sub.id).rank}</span>
                        <span className="text-xs text-foreground0">Score: {leaderboard.find(l => l.submissionId === sub.id).finalScore.toFixed(2)}</span>
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
