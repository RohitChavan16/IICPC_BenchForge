import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchLogs } from '@/services/api/logsService'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Search, Filter } from 'lucide-react'

const levels = ['all', 'info', 'warn', 'error', 'debug'] as const

export function LogsExplorerPage() {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all')
  const { data: logs } = useQuery({ queryKey: ['logs', query, level], queryFn: () => fetchLogs(query, level === 'all' ? undefined : level) })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Log intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Logs explorer</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full rounded-3xl border border-white/10 bg-slate-950/80 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20 sm:w-80"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search logs"
            />
          </div>
          <div className="flex items-center gap-2 rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
            <Filter size={16} />
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value as any)}
              className="bg-transparent text-sm text-white outline-none"
            >
              {levels.map((type) => (
                <option key={type} value={type} className="bg-slate-950 text-white">
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Card title="Logs" description="Search and filter platform logs in real time.">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-4">
          <div className="grid gap-4">
            {(logs ?? []).map((log) => (
              <div key={log.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{log.source}</p>
                    <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  <Badge variant={log.level === 'error' ? 'danger' : log.level === 'warn' ? 'warning' : 'info'}>{log.level}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{log.message}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">{log.service}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
