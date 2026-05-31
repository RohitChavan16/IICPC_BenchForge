import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UploadCloud, FileCode2, Box, Server, Zap, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'

type SubmissionStatus = 'idle' | 'uploading' | 'building' | 'deploying' | 'benchmarking' | 'completed' | 'failed'

const timelineSteps = [
  { status: 'uploading', label: 'Uploading Code', icon: UploadCloud, desc: 'Securely transferring submission.' },
  { status: 'building', label: 'Building Container', icon: Box, desc: 'Compiling and sandboxing the environment.' },
  { status: 'deploying', label: 'Deploying', icon: Server, desc: 'Allocating resources on isolated workers.' },
  { status: 'benchmarking', label: 'Benchmarking', icon: Zap, desc: 'Generating distributed load and collecting telemetry.' },
  { status: 'completed', label: 'Completed', icon: CheckCircle, desc: 'Run finished successfully.' },
]

export function SubmissionPage() {
  const [status, setStatus] = useState<SubmissionStatus>('idle')
  const [activeStepIndex, setActiveStepIndex] = useState(-1)

  // Mock progress simulation for the demo
  useEffect(() => {
    if (status === 'idle' || status === 'completed' || status === 'failed') return

    const timers: ReturnType<typeof setTimeout>[] = []
    
    if (status === 'uploading') {
      setActiveStepIndex(0)
      timers.push(setTimeout(() => setStatus('building'), 2000))
    } else if (status === 'building') {
      setActiveStepIndex(1)
      timers.push(setTimeout(() => setStatus('deploying'), 3500))
    } else if (status === 'deploying') {
      setActiveStepIndex(2)
      timers.push(setTimeout(() => setStatus('benchmarking'), 3000))
    } else if (status === 'benchmarking') {
      setActiveStepIndex(3)
      timers.push(setTimeout(() => setStatus('completed'), 5000))
    }

    return () => timers.forEach(clearTimeout)
  }, [status])

  useEffect(() => {
    if (status === 'completed') {
      setActiveStepIndex(4)
    }
  }, [status])

  const handleUpload = () => {
    setStatus('uploading')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Benchmark Pipeline</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Submit Infrastructure</h1>
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <Card className="flex flex-col items-center justify-center border-dashed border-white/20 bg-slate-950/50 p-12 text-center hover:border-cyan-500/50 hover:bg-slate-950/80 transition-colors">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
                <UploadCloud size={40} />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">Upload Source or Binary</h3>
              <p className="mt-2 text-sm text-slate-400">Drag and drop your ZIP or TAR file here, or click to browse.</p>
              <Button className="mt-8 px-8" onClick={handleUpload}>
                Select File
              </Button>
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
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-violet-500/5" />
              <div className="relative p-6">
                <h3 className="text-lg font-semibold text-white mb-8">Pipeline Status</h3>
                
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-px bg-white/10" />

                  <div className="space-y-8">
                    {timelineSteps.map((step, idx) => {
                      const isPast = activeStepIndex > idx
                      const isActive = activeStepIndex === idx
                      
                      return (
                        <div key={step.status} className="relative flex items-center gap-6">
                          <div className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors ${
                            isActive ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400 shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]' :
                            isPast ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' :
                            'border-white/10 bg-slate-900/50 text-slate-500'
                          }`}>
                            {isActive ? <Loader2 className="animate-spin" size={24} /> : <step.icon size={24} />}
                          </div>
                          
                          <div className={isActive ? 'opacity-100' : isPast ? 'opacity-80' : 'opacity-40'}>
                            <p className="text-lg font-semibold text-white">{step.label}</p>
                            <p className="text-sm text-slate-400">{step.desc}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {status === 'completed' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                  >
                    <div>
                      <p className="text-lg font-semibold text-emerald-400">Benchmark Completed Successfully</p>
                      <p className="text-sm text-emerald-400/80 mt-1">Your results have been processed and scored.</p>
                    </div>
                    <div className="flex gap-4">
                      <Button asChild variant="secondary" className="bg-white/5 hover:bg-white/10">
                        <Link to="/benchmarks">View Logs</Link>
                      </Button>
                      <Button asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
                        <Link to="/leaderboard" className="flex items-center gap-2">
                          View Leaderboard <ArrowRight size={16} />
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
