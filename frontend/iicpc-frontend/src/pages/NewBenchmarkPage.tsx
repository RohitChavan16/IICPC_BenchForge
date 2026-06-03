import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createBenchmark } from '@/services/api/benchmarkService'
import { Play } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'

export function NewBenchmarkPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pushToast } = useToast()

  const [name, setName] = useState('')
  const [targetType, setTargetType] = useState<'mock' | 'deployment'>('mock')
  const [submissionId, setSubmissionId] = useState('')
  const [deploymentId, setDeploymentId] = useState('')
  const [workerCount, setWorkerCount] = useState(100)
  const [totalRequests, setTotalRequests] = useState(1000)

  const { mutate, isPending } = useMutation({
    mutationFn: createBenchmark,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks'] })
      pushToast({ variant: 'success', title: 'Benchmark started successfully' })
      navigate(`/benchmarks/${data.id}`)
    },
    onError: (error: any) => {
      pushToast({ variant: 'error', title: error.response?.data || 'Failed to start benchmark' })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      pushToast({ variant: 'error', title: 'Benchmark name is required' })
      return
    }
    if (targetType === 'deployment') {
      if (!submissionId.trim()) {
        pushToast({ variant: 'error', title: 'Submission ID is required for deployment target' })
        return
      }
      if (!deploymentId.trim()) {
        pushToast({ variant: 'error', title: 'Deployment ID is required for deployment target' })
        return
      }
    }
    
    mutate({
      name,
      targetType,
      submissionId: targetType === 'deployment' ? submissionId : undefined,
      deploymentId: targetType === 'deployment' ? deploymentId : undefined,
      workerCount,
      totalRequests,
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Benchmark Orchestration</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">New Benchmark</h1>
      </div>

      <Card title="Configuration" description="Set up your load test parameters.">
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. baseline-test-01"
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Target Type</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as 'mock' | 'deployment')}
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            >
              <option value="mock">Mock Exchange (Internal)</option>
              <option value="deployment">Live Deployment</option>
            </select>
          </div>

          {targetType === 'deployment' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Submission ID</label>
                <input
                  type="text"
                  value={submissionId}
                  onChange={(e) => setSubmissionId(e.target.value)}
                  placeholder="e.g. sub-xxxx"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Deployment ID</label>
                <input
                  type="text"
                  value={deploymentId}
                  onChange={(e) => setDeploymentId(e.target.value)}
                  placeholder="e.g. dep-xxxx"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  required
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Worker Count</label>
              <input
                type="number"
                value={workerCount}
                onChange={(e) => setWorkerCount(parseInt(e.target.value))}
                min="1"
                max="5000"
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                required
              />
              <p className="text-xs text-slate-500">Concurrent simulated traders</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Total Requests</label>
              <input
                type="number"
                value={totalRequests}
                onChange={(e) => setTotalRequests(parseInt(e.target.value))}
                min="1"
                max="1000000"
                className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                required
              />
              <p className="text-xs text-slate-500">Total volume of orders</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full justify-center"
            >
              <Play className="mr-2 h-4 w-4" />
              {isPending ? 'Starting...' : 'Start Benchmark'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
