import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import * as deploymentService from '@/services/api/deploymentService'
import { Server, Activity, ArrowRight } from 'lucide-react'

export function DeploymentPage() {
  const [submissionId, setSubmissionId] = useState('')
  const [containerPort, setContainerPort] = useState('8080')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const dep = await deploymentService.createDeployment(submissionId, parseInt(containerPort, 10))
      // navigate to benchmarks page to run benchmark on this deployment
      navigate('/benchmarks/new', { state: { deploymentId: dep.id } })
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data || 'Deployment failed. Make sure the submission ID is valid and has status BUILT.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Infrastructure</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Deploy Engine</h1>
      </div>

      <Card title="Deploy Built Submission">
        <form onSubmit={handleDeploy} className="mt-4 space-y-6">
          <div>
            <label className="text-sm text-slate-400">Submission ID</label>
            <input 
              type="text" 
              required
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white outline-none focus:border-cyan-400" 
              placeholder="e.g. uuid-of-submission" 
            />
            <p className="mt-1 text-xs text-slate-500">Provide the ID of your successfully built submission.</p>
          </div>

          <div>
            <label className="text-sm text-slate-400">Container Port</label>
            <input 
              type="number" 
              required
              value={containerPort}
              onChange={(e) => setContainerPort(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-white outline-none focus:border-cyan-400" 
              placeholder="8080" 
            />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <Button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2">
            {loading ? <Activity className="animate-pulse" size={20} /> : <Server size={20} />}
            Deploy
          </Button>
        </form>
      </Card>
    </div>
  )
}
