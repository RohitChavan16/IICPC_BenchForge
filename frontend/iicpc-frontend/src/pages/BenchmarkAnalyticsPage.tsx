import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAllBenchmarks } from '@/services/api/analyticsService'
import { Card } from '@/components/ui/Card'
import { BenchmarkTrendChart } from '@/components/analytics/BenchmarkTrendChart'
import { BenchmarkComparisonChart } from '@/components/analytics/BenchmarkComparisonChart'
import { BenchmarkComparisonCard } from '@/components/analytics/BenchmarkComparisonCard'
import type { BenchmarkSession } from '@/types/api'

export function BenchmarkAnalyticsPage() {
  const { data: sessions = [], isLoading, isError } = useQuery({ queryKey: ['allBenchmarks'], queryFn: fetchAllBenchmarks })
  const [windowSize, setWindowSize] = useState<number | 'all'>(5)
  const [selectedRuns, setSelectedRuns] = useState<string[]>([])
  const [metric, setMetric] = useState<'tps' | 'successRate' | 'p50' | 'p90' | 'p99' | 'totalRequests'>('tps')

  const completed = useMemo(() => sessions.filter((s) => s.status === 'Completed'), [sessions])
  const sorted = completed.slice().sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  const visible = useMemo(() => {
    if (windowSize === 'all') return sorted
    return sorted.slice(0, windowSize)
  }, [sorted, windowSize])

  const selectedSessions: BenchmarkSession[] = useMemo(() => selectedRuns.map((id) => sessions.find((s) => s.id === id)).filter(Boolean) as BenchmarkSession[], [selectedRuns, sessions])

  if (isLoading) return <div className="mx-auto max-w-4xl py-20 text-center text-white">Loading analytics...</div>
  if (isError) return <div className="mx-auto max-w-4xl py-20 text-center text-white">Failed to load analytics.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Analytics</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Benchmark analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={windowSize} onChange={(e) => setWindowSize(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="rounded-3xl border border-white/10 bg-slate-950/80 py-2 px-4 text-sm text-white">
            <option value={5}>Last 5 runs</option>
            <option value={10}>Last 10 runs</option>
            <option value={'all'}>All runs</option>
          </select>
          <select value={metric} onChange={(e) => setMetric(e.target.value as any)} className="rounded-3xl border border-white/10 bg-slate-950/80 py-2 px-4 text-sm text-white">
            <option value="tps">TPS</option>
            <option value="successRate">Success rate</option>
            <option value="p50">p50</option>
            <option value="p90">p90</option>
            <option value="p99">p99</option>
            <option value="totalRequests">Request volume</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Metric trend" description="Trend across selected runs.">
          <BenchmarkTrendChart sessions={visible} metric={metric} title={`Trend — ${metric}`} />
        </Card>

        <Card title="Compare runs" description="Select runs below to compare metrics.">
          <div className="space-y-4">
            <div className="grid gap-2 max-h-48 overflow-auto">
              {sorted.map((s) => (
                <label key={s.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedRuns.includes(s.id)} onChange={(e) => {
                    if (e.target.checked) setSelectedRuns((cur) => (cur.includes(s.id) ? cur : [...cur, s.id]))
                    else setSelectedRuns((cur) => cur.filter((id) => id !== s.id))
                  }} />
                  <span className="text-sm text-slate-300">{s.name} — {new Date(s.startedAt).toLocaleString()}</span>
                </label>
              ))}
            </div>
            <div>
              {selectedSessions.length >= 2 ? (
                <BenchmarkComparisonChart sessions={selectedSessions} />
              ) : (
                <p className="text-sm text-slate-400">Select at least two completed runs to compare.</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {selectedSessions.length >= 2 && (
        <div className="grid gap-4 md:grid-cols-3">
          <BenchmarkComparisonCard metric="Duration (s)" base={selectedSessions[0].duration ?? 0} compare={selectedSessions[1].duration ?? 0} />
          <BenchmarkComparisonCard metric="TPS" base={Math.round((selectedSessions[0].totalRequests / (selectedSessions[0].duration || 1)) * 10) / 10} compare={Math.round((selectedSessions[1].totalRequests / (selectedSessions[1].duration || 1)) * 10) / 10} />
          <BenchmarkComparisonCard metric="Success rate (%)" base={((selectedSessions[0].successCount / Math.max(1, selectedSessions[0].totalRequests)) * 100).toFixed(1)} compare={((selectedSessions[1].successCount / Math.max(1, selectedSessions[1].totalRequests)) * 100).toFixed(1)} />
        </div>
      )}
    </div>
  )
}
