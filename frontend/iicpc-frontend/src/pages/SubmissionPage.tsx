import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHero } from '@/components/layout/PageHero'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { UploadCloud, Box, Server, Zap, CheckCircle, Loader2, XCircle, Clock, ShieldCheck, TerminalSquare, FileArchive, ChevronDown, ChevronUp, Trophy, Activity, Check } from 'lucide-react'
import * as submissionService from '@/services/api/submissionService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSubmissionStore } from '@/stores/useSubmissionStore'
import { useToast } from '@/components/ui/ToastProvider'
import { fetchLeaderboardEntries, fetchLeaderboardForTeam } from '@/services/api/leaderboardService'
import { DeploymentControlHeader } from '@/components/submission/DeploymentControlHeader'
import { SubmissionFiltersBar } from '@/components/submission/SubmissionFiltersBar'
import type { FilterState } from '@/components/submission/SubmissionFiltersBar'
import { SubmissionHistoryGrid } from '@/components/submission/SubmissionHistoryGrid'

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
  
  const { activeSubmission, submissionsHistory, fetchSubmissions, setActiveSubmission, isLoading } = useSubmissionStore()
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [filters, setFilters] = useState<FilterState>({ search: '', language: 'all', status: 'all', date: 'all' })
  
  // Drag and drop states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'preparing' | 'uploading' | 'processing'>('idle')

  const [selectedLanguage, setSelectedLanguage] = useState('go')
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [isPipelineExpanded, setIsPipelineExpanded] = useState(true)
  const [isLogsExpanded, setIsLogsExpanded] = useState(true)

  const [logs, setLogs] = useState<any[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchAll = () => {
      fetchSubmissions()
      const teamName = user?.team || user?.name
      if (teamName) {
        fetchLeaderboardForTeam(teamName).then(data => setLeaderboard(data.items || [])).catch(console.error)
      } else {
        fetchLeaderboardEntries().then(data => setLeaderboard(data.items || [])).catch(console.error)
      }
    }
    fetchAll()
  }, [fetchSubmissions, user])

  // WebSocket for Logs and State Updates
  useEffect(() => {
    if (!activeSubmission?.id) return

    setLogs([])
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
          pushToast({ 
            title: 'Pipeline Failed', 
            variant: 'error',
            description: (
              <div className="mt-2 space-y-2">
                <p className="text-sm font-medium text-foreground">Submission <span className="font-bold text-rose-400">{activeSubmission.submissionName}</span> encountered an error.</p>
                <p className="text-xs p-2 bg-rose-500/10 rounded border border-rose-500/20 text-rose-300">{data.message || 'Unknown error'}</p>
                <button 
                  onClick={() => navigate(`/submissions/${activeSubmission.id}/report`)}
                  className="w-full mt-2 py-1.5 px-4 bg-secondary hover:bg-secondary/80 text-foreground rounded text-sm font-semibold transition-colors"
                >
                  View Logs
                </button>
              </div>
            )
          })
        } else if (data.stage === 'BENCHMARK' && data.stage_status === 'SUCCESS') {
          const teamName = useAuthStore.getState().user?.team || useAuthStore.getState().user?.name;
          const fetchFn = teamName ? () => fetchLeaderboardForTeam(teamName) : fetchLeaderboardEntries;
          fetchFn().then(res => {
            const items = res.items || [];
            setLeaderboard(items);
            const entry = items.find((l: any) => l.submissionId === activeSubmission.id);
            pushToast({ 
              title: 'Benchmark Completed', 
              variant: 'success',
              description: (
                <div className="mt-2 space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    Submission <span className="text-emerald-400 font-bold">{activeSubmission.submissionName}</span> has finished processing.
                  </p>
                  {entry && (
                    <div className="flex gap-6 p-3 bg-secondary/30 rounded-xl border border-border/50 shadow-inner">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">Rank</p>
                        <p className="text-2xl font-black text-amber-400 drop-shadow-sm">#{entry.rank}</p>
                      </div>
                      <div className="w-px bg-border/50 self-stretch"></div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">Score</p>
                        <p className="text-2xl font-black text-emerald-400 drop-shadow-sm">{entry.finalScore.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={() => navigate(`/submissions/${activeSubmission.id}/report`)}
                    className="w-full mt-1 py-2 px-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-sm font-bold transition-colors shadow-sm"
                  >
                    View Full Report
                  </button>
                </div>
              )
            });
          }).catch(console.error);
        }
      }
    }

    ws.onerror = (err) => console.error("WebSocket error:", err)

    return () => {
      ws.close()
    }
  }, [activeSubmission?.id])

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  // Drag and drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    handleFileSelection(file)
  }
  
  const handleFileSelection = (file?: File) => {
    if (!file) return
    if (!file.name.endsWith('.zip') && file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
      pushToast({ title: 'Invalid Format', description: 'Please upload a .zip package.', variant: 'error' })
      return
    }
    setSelectedFile(file)
    setSelectedFileName(file.name)
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !selectedFile) return

    const formData = new FormData(e.currentTarget)
    formData.append('teamName', user.team || user.name)
    formData.set('file', selectedFile) // Ensure D&D file is attached securely

    try {
      setIsUploading(true)
      setUploadProgress('preparing')
      // Simulate preparing state
      await new Promise(r => setTimeout(r, 400))
      
      setUploadProgress('uploading')
      const newSub = await submissionService.createSubmission(formData)
      
      setUploadProgress('processing')
      // Simulate processing state
      await new Promise(r => setTimeout(r, 400))

      pushToast({ title: 'Success', description: 'Package deployed successfully.', variant: 'success' })
      setShowUploadForm(false)
      setSelectedFile(null)
      setSelectedFileName('')
      setUploadProgress('idle')
      setActiveSubmission(newSub)
      fetchSubmissions() 
      if (isSubmitRoute) {
        navigate('/submissions')
      }
    } catch (err: any) {
      pushToast({ title: 'Deploy Failed', description: err.message || 'Unknown error', variant: 'error' })
      setUploadProgress('idle')
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
      if (stepIndex === -1) stepIndex = 0 

      if (status === 'SUCCESS') stepIndex += 1
      if (status === 'FAILED') isFailed = true
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
  const showEmptyUpload = isSubmitRoute || showUploadForm

  const totalSubmissions = submissionsHistory.length;
  const totalCompleted = submissionsHistory.filter(s => s.status.toLowerCase() === 'completed').length;
  const successRate = totalSubmissions > 0 ? ((totalCompleted / totalSubmissions) * 100).toFixed(1) + '%' : '0%';
  const currentRunning = submissionsHistory.filter(s => !['completed', 'failed', 'cancelled'].includes(s.status.toLowerCase())).length;

  const userLeaderboardEntries = leaderboard.filter(l => 
    submissionsHistory.some(s => s.id === l.submissionId)
  )

  const bestRankNum = userLeaderboardEntries.length > 0 ? Math.min(...userLeaderboardEntries.map(l => l.rank)) : null
  const bestScoreNum = userLeaderboardEntries.length > 0 ? Math.max(...userLeaderboardEntries.map(l => l.finalScore)) : null
  const worstScoreNum = userLeaderboardEntries.length > 0 ? Math.min(...userLeaderboardEntries.map(l => l.finalScore)) : null
  const failedCount = submissionsHistory.filter(s => s.status.toLowerCase() === 'failed').length;
  const correctnessScores = userLeaderboardEntries.filter(l => l.correctnessScore !== undefined).map(l => l.correctnessScore as number)
  const avgCorrectnessNum = correctnessScores.length > 0 ? correctnessScores.reduce((a,b)=>a+b,0)/correctnessScores.length : null

  const filteredHistory = submissionsHistory.filter(sub => {
    if (filters.search && !sub.submissionName.toLowerCase().includes(filters.search.toLowerCase()) && !sub.id.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.language !== 'all' && sub.language !== filters.language) return false;
    if (filters.status !== 'all' && sub.status.toLowerCase() !== filters.status) return false;
    if (filters.date !== 'all') {
      const date = new Date(sub.createdAt)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (filters.date === 'today' && diffDays > 1) return false;
      if (filters.date === 'week' && diffDays > 7) return false;
      if (filters.date === 'month' && diffDays > 30) return false;
    }
    return true;
  })

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 md:space-y-6 pb-2 overflow-x-hidden">
      <PageHero 
        theme={isSubmitRoute ? "dashboard" : "submission"}
        icon={<TerminalSquare size={40} />}
        title={isSubmitRoute ? "Deploy Engine" : "Deployment History"}
        subtitle={isSubmitRoute 
          ? "Upload your engine package and deploy it for high-frequency benchmarking on the evaluation cluster."
          : "Command Center for your deployments. Review past runs, analyze validation logs, and push new iterations to the leaderboard."}
        statusPills={[
          { label: activeSubmission ? 'Deployment Active' : 'Awaiting Deployment', variant: activeSubmission ? 'success' : 'info' }
        ]}
        metadata={[
          { label: 'Total Deployments', value: totalSubmissions, icon: <FileArchive size={14} /> },
          { label: 'Success Rate', value: successRate, icon: <CheckCircle size={14} /> },
          { label: 'Active Jobs', value: currentRunning, icon: <Zap size={14} /> },
          { label: 'Best Rank', value: bestRankNum !== null ? `#${bestRankNum}` : 'Unranked', icon: <Trophy size={14} /> },
          { label: 'Supported Runtimes', value: 'Go, Rust, C++', icon: <Box size={14} /> }
        ]}
      />

      <AnimatePresence mode="wait">
        {showEmptyUpload && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-6 md:grid-cols-2 items-stretch"
          >
            <Card title="Upload Engine Package" className="h-full flex flex-col">
              <form onSubmit={handleUpload} className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="text-sm font-medium text-foreground">Deployment Name</label>
                    <input type="text" name="submissionName" required className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-sm" placeholder="e.g. baseline-engine-v2" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Language Runtime</label>
                    <div className="flex gap-2 mt-1.5">
                      {['go', 'rust', 'cpp'].map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setSelectedLanguage(lang)}
                          className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${
                            selectedLanguage === lang
                              ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]'
                              : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          {lang === 'go' ? 'Go' : lang === 'rust' ? 'Rust' : 'C++'}
                        </button>
                      ))}
                      <input type="hidden" name="language" value={selectedLanguage} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Source Package (.zip)</label>
                    <div 
                      className={`mt-1.5 relative group overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
                        isDragging ? 'border-primary bg-primary/10 scale-[1.02] shadow-[0_0_30px_rgba(var(--primary),0.15)]' : 
                        selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : 
                        'border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/50'
                      }`}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                    >
                      <input
                        id="submission-source-file"
                        type="file"
                        accept=".zip"
                        className="sr-only"
                        onChange={(e) => handleFileSelection(e.target.files?.[0])}
                      />
                      
                      <label htmlFor="submission-source-file" className={`flex flex-col items-center justify-center w-full p-8 ${selectedFile ? 'cursor-default' : 'cursor-pointer'} min-h-[220px]`}>
                        {!selectedFile ? (
                          <>
                            <div className={`p-4 rounded-full mb-4 transition-all duration-300 ${isDragging ? 'bg-primary text-primary-foreground scale-110 shadow-lg' : 'bg-background border border-border text-muted-foreground group-hover:text-primary group-hover:scale-105 group-hover:shadow-sm'}`}>
                              <UploadCloud size={32} />
                            </div>
                            <h4 className={`text-lg font-bold mb-1 transition-colors ${isDragging ? 'text-primary' : 'text-foreground'}`}>
                              {isDragging ? 'Release to Upload Package' : 'Drag & Drop Engine Package'}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              {isDragging ? 'Drop your .zip file here' : 'or click to browse files'}
                            </p>
                            <div className="flex gap-4 text-xs font-semibold text-muted-foreground">
                              <span className="flex items-center gap-1 bg-background px-2 py-1 rounded border border-border shadow-sm"><FileArchive size={12}/> .ZIP Package</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full flex flex-col items-center">
                             <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-500 mb-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                               <CheckCircle size={32} />
                             </div>
                             <h4 className="text-lg font-bold text-foreground mb-1">{selectedFile.name}</h4>
                             <p className="text-sm text-muted-foreground font-mono mb-4">{formatBytes(selectedFile.size)} • ZIP Archive</p>
                             <Badge variant="success" className="uppercase tracking-widest text-[10px] px-3 py-1 shadow-sm">
                               READY FOR SUBMISSION
                             </Badge>
                             <button 
                               type="button" 
                               onClick={(e) => { e.preventDefault(); setSelectedFile(null); setSelectedFileName(''); }}
                               className="mt-6 text-xs text-muted-foreground hover:text-rose-500 font-semibold underline underline-offset-2 transition-colors"
                             >
                               Remove package
                             </button>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 p-4 rounded-xl border border-border bg-card shadow-sm">
                    <h5 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">Pre-Flight Checklist</h5>
                    <div className="space-y-2.5">
                       <ValidationItem label="Language runtime selected" isValid={selectedLanguage !== ''} />
                       <ValidationItem label="ZIP package attached" isValid={selectedFile !== null} />
                       <ValidationItem label="Package size accepted" isValid={selectedFile !== null && selectedFile.size <= 20 * 1024 * 1024} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 shrink-0">
                  <button 
                    type="submit" 
                    disabled={isUploading || !selectedFile || !selectedLanguage || selectedFile.size > 20 * 1024 * 1024}
                    className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 relative overflow-hidden ${
                      (!selectedFile || !selectedLanguage || selectedFile.size > 20 * 1024 * 1024) 
                        ? 'bg-muted text-muted-foreground border border-border cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] hover:-translate-y-0.5'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        {uploadProgress === 'preparing' ? 'Preparing Package...' : 
                         uploadProgress === 'uploading' ? 'Uploading to Hub...' : 'Processing Pipeline...'}
                      </>
                    ) : (
                      <>
                        <UploadCloud size={18} />
                        Deploy Engine
                      </>
                    )}
                  </button>
                  {showActivePanel && (
                    <Button type="button" variant="secondary" onClick={() => navigate('/submissions')} className="w-full mt-3">
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Card>

            <Card title="Benchmarking Contract" description="Engine specifications and evaluation criteria." className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mt-4 space-y-8">
                
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground border-b border-border pb-2">Network & Endpoints</h4>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-4 items-start p-3 rounded-xl border border-border bg-muted/20">
                      <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">GET /health</p>
                        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">Return HTTP 200 OK. Used by the validation stage to ensure your container is fully booted.</p>
                      </div>
                    </li>
                    <li className="flex gap-4 items-start p-3 rounded-xl border border-border bg-muted/20">
                      <Zap className="text-purple-500 shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-bold text-purple-600 dark:text-purple-400">POST /order</p>
                        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">Accepts JSON: <code className="bg-background border border-border px-1.5 py-0.5 rounded font-mono text-[10px]">{"{ symbol, price, quantity, side }"}</code>. Must return HTTP 2xx on successful matching. Up to 100k TPS.</p>
                      </div>
                    </li>
                    <li className="flex gap-4 items-start p-3 rounded-xl border border-border bg-muted/20">
                      <Server className="text-primary shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-bold text-primary">Port 8080</p>
                        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">Your web server MUST listen on port 8080, binding to <code className="bg-background border border-border px-1.5 py-0.5 rounded font-mono text-[10px]">0.0.0.0</code>.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground border-b border-border pb-2">Traffic Personas</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                      <p className="font-bold text-cyan-600 dark:text-cyan-400 text-sm mb-1">HFT Bots</p>
                      <p className="text-xs text-muted-foreground">High burst rates, massive concurrency.</p>
                    </div>
                    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                      <p className="font-bold text-amber-600 dark:text-amber-400 text-sm mb-1">Retail Users</p>
                      <p className="text-xs text-muted-foreground">Slow, sustained, predictable traffic.</p>
                    </div>
                    <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
                      <p className="font-bold text-purple-600 dark:text-purple-400 text-sm mb-1">Whales</p>
                      <p className="text-xs text-muted-foreground">Massive isolated order quantities.</p>
                    </div>
                    <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-1">Market Makers</p>
                      <p className="text-xs text-muted-foreground">Constant two-sided quote updates.</p>
                    </div>
                    <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5">
                      <p className="font-bold text-rose-600 dark:text-rose-400 text-sm mb-1">Sniper Bots</p>
                      <p className="text-xs text-muted-foreground">Latency-sensitive aggressive orders.</p>
                    </div>
                    <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mb-1">Institutions</p>
                      <p className="text-xs text-muted-foreground">Large block trades parsed over time.</p>
                    </div>
                  </div>
                </div>
                
              </div>
            </Card>
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
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">{isSubmissionOver ? 'Previous Deployment' : 'Active Deployment'}</p>
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
                  New Deployment
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
                          <p className="text-emerald-700 dark:text-emerald-200/80 mb-8 text-center max-w-md">Your engine has been successfully built, deployed, validated, and benchmarked.</p>
                          
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

      {!isSubmitRoute && (
        <div className="space-y-6 mt-4 bg-card dark:bg-[#0b0e14] p-4 md:p-6 rounded-2xl border border-border w-full overflow-hidden shadow-sm">
          <DeploymentControlHeader 
            totalDeployments={totalSubmissions}
            successfulSubmissions={totalCompleted}
            failedSubmissions={failedCount}
            activeJobs={currentRunning}
            bestRank={bestRankNum}
            bestScore={bestScoreNum}
            worstScore={worstScoreNum}
          />

          <SubmissionFiltersBar 
            filters={filters}
            setFilters={setFilters}
            onRefresh={fetchSubmissions}
            isRefreshing={isLoading}
          />

          <SubmissionHistoryGrid 
            submissions={filteredHistory}
            leaderboard={leaderboard}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  )
}

function ValidationItem({ label, isValid }: { label: string, isValid: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`p-1 rounded-full ${isValid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500/50'}`}>
        {isValid ? <Check size={14} strokeWidth={3} /> : <XCircle size={14} />}
      </div>
      <span className={isValid ? 'text-foreground font-medium' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}
