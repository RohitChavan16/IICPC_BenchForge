import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Trophy } from 'lucide-react'
import { fetchLeaderboardEntries } from '@/services/api/leaderboardService'
import { fetchBenchmarkTelemetryHistory } from '@/services/api/telemetryService'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export function LeaderboardDetailsPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const [loading, setLoading] = useState(true)
  const [entry, setEntry] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      if (!teamId) return
      setLoading(true)
      try {
        const lb = await fetchLeaderboardEntries()
        // Assuming teamId in URL is teamName
        const found = lb.items.find((e: any) => e.teamName === teamId)
        setEntry(found)

        if (found && found.benchmarkId) {
          // fetch historical telemetry
          const historyData = await fetchBenchmarkTelemetryHistory(found.benchmarkId)
          setHistory(historyData || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [teamId])

  if (loading) return <div className="text-center py-20 text-slate-400">Loading details...</div>
  if (!entry) return <div className="text-center py-20 text-slate-400">Team not found on leaderboard.</div>

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link to="/leaderboard" className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-2 mb-4">
          <ArrowLeft size={16} /> Back to Leaderboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]">
            <Trophy size={32} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-400/80">Rank #{entry.rank}</p>
            <h1 className="text-3xl font-bold text-white">{entry.teamName}</h1>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-400 mb-1">Final Score</p>
          <p className="text-3xl font-bold text-emerald-400">{entry.finalScore.toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400 mb-1">Throughput</p>
          <p className="text-2xl font-semibold text-cyan-400">{entry.tps.toFixed(0)} <span className="text-sm font-normal text-slate-500">TPS</span></p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400 mb-1">Latency p90</p>
          <p className="text-2xl font-semibold text-violet-400">{(entry.p90).toFixed(2)} <span className="text-sm font-normal text-slate-500">ms</span></p>
        </Card>
        <Card>
          <p className="text-sm text-slate-400 mb-1">Success Rate</p>
          <p className="text-2xl font-semibold text-purple-400">{entry.successRate.toFixed(1)} <span className="text-sm font-normal text-slate-500">%</span></p>
        </Card>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white">Benchmark Telemetry History</h3>
        
        {history.length === 0 ? (
          <Card className="text-center py-10 text-slate-400">
            No historical telemetry data found for this benchmark.
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Throughput (TPS)">
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorTps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()} stroke="#ffffff50" />
                    <YAxis stroke="#ffffff50" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                      labelFormatter={(t) => new Date(t).toLocaleTimeString()}
                    />
                    <Area type="monotone" dataKey="tps" stroke="#06b6d4" fillOpacity={1} fill="url(#colorTps)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Average Latency (ms)">
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()} stroke="#ffffff50" />
                    <YAxis stroke="#ffffff50" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                      labelFormatter={(t) => new Date(t).toLocaleTimeString()}
                    />
                    <Area type="monotone" dataKey="p50" stroke="#10b981" fillOpacity={1} fill="url(#colorLat)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}
      </div>

    </div>
  )
}
