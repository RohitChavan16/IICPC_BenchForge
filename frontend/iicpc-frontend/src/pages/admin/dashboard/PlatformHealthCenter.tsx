import { motion } from 'framer-motion'
import { Activity, CheckCircle2, AlertTriangle, XCircle, Settings, ArrowRight, Server, Clock, Zap, FileText, BarChart2 } from 'lucide-react'

import { useEffect, useState } from 'react'
import { fetchHealthStatus } from '@/services/api/infraService'
import type { HealthStatus } from '@/types/api'
import { getSharedWebsocketClient } from '@/services/websocket/websocketClient'
import type { MetricSnapshot } from '@/types/api'

export function PlatformHealthCenter() {
  const [services, setServices] = useState<HealthStatus[]>([])
  const [snapshot, setSnapshot] = useState<MetricSnapshot | null>(null)

  useEffect(() => {
    const ws = getSharedWebsocketClient(import.meta.env.VITE_WS_URL || 'ws://localhost:8081/ws')
    setSnapshot(ws.getLatestSnapshot())
    const handleSnapshot = (data: MetricSnapshot) => setSnapshot(data)
    ws.addHandler(handleSnapshot)
    ws.connect()

    const fetchHealth = () => fetchHealthStatus().then(setServices).catch(console.error)
    fetchHealth()
    const interval = setInterval(fetchHealth, 15000)

    return () => {
      ws.removeHandler(handleSnapshot)
      clearInterval(interval)
    }
  }, [])

  const globalUptime = services.length > 0 && services.every(s => s.status.toLowerCase() === 'healthy') ? '99.99%' : '98.50%'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden h-full"
    >
      <div className="border-b border-slate-200 p-4 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Activity size={18} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Platform Health</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live operational status and service uptime</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium">
            <Settings size={14} />
            Settings
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors text-xs font-medium">
            View Details
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col gap-6">
        {/* Global Metrics & Shortcuts */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="col-span-2 lg:col-span-1 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <Clock size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">Uptime</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{globalUptime}</div>
          </div>
          <div className="col-span-1 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <Server size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">Req Rate</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{snapshot ? Math.floor(snapshot.tps) : 0}<span className="text-sm text-slate-500">/s</span></div>
          </div>
          <div className="col-span-1 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 mb-1">
              <Zap size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">Latency</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{snapshot ? Math.floor(snapshot.p50) : 0}<span className="text-sm text-slate-500">ms</span></div>
          </div>
          <div className="col-span-2 lg:col-span-2 flex gap-2">
            <button className="flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/50 dark:hover:bg-slate-800/50 transition-colors">
              <FileText size={18} className="text-slate-600 dark:text-slate-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Logs</span>
            </button>
            <button className="flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/50 dark:hover:bg-slate-800/50 transition-colors">
              <BarChart2 size={18} className="text-slate-600 dark:text-slate-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Metrics</span>
            </button>
          </div>
        </div>

        {/* Services List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
          {services.map((service, idx) => {
            const isHealthy = service.status.toLowerCase() === 'healthy'
            const isDegraded = service.status.toLowerCase() === 'warning' || service.status.toLowerCase() === 'degraded'
            
            return (
              <motion.div 
                key={service.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.2 + idx * 0.05 }}
                className="group flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
              >
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{service.label}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{service.status}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[120px]">{service.details}</span>
                  </div>
                </div>
                
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
                  isHealthy 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                    : isDegraded
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                    : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.1)]'
                }`}>
                  {isHealthy && <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-emerald-400"></span>}
                  {isDegraded && <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-amber-400"></span>}
                  {isHealthy && <CheckCircle2 size={16} />}
                  {isDegraded && <AlertTriangle size={16} />}
                  {!isHealthy && !isDegraded && <XCircle size={16} />}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
