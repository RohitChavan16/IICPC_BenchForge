import { motion } from 'framer-motion'
import { Database, Activity, HardDrive, AlertTriangle, UserCheck, UserMinus, Trash2, Cpu } from 'lucide-react'
import { InfrastructureStatusStrip } from '@/components/admin/infra/InfrastructureStatusStrip'
import { InfraCard } from '@/components/admin/infra/InfraCard'
import { AnimatedCounter } from '@/components/admin/infra/AnimatedCounter'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export function RedisMonitoringPage() {
  const chartData = [
    { time: '10:00', ops: 4500, memory: 4.2, hitRatio: 98 },
    { time: '10:05', ops: 4800, memory: 4.3, hitRatio: 97.5 },
    { time: '10:10', ops: 4200, memory: 4.1, hitRatio: 98.2 },
    { time: '10:15', ops: 8500, memory: 5.8, hitRatio: 95.5 },
    { time: '10:20', ops: 6200, memory: 5.2, hitRatio: 96.8 },
    { time: '10:25', ops: 5100, memory: 4.5, hitRatio: 97.9 },
    { time: '10:30', ops: 4900, memory: 4.4, hitRatio: 98.1 },
  ]

  return (
    <div className="space-y-8 pb-12">
      <InfrastructureStatusStrip />

      {/* Hero Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-rose-500 font-semibold">Redis Observability</p>
        <h1 className="text-4xl font-bold text-foreground">Redis Metrics</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">High-performance caching and message broker monitoring. View memory utilization, cache efficiency, and pub/sub activity.</p>
        <div className="flex gap-4 mt-4">
           <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium">Open RedisInsight</button>
           <button className="px-4 py-2 bg-background border border-border/50 hover:bg-muted text-foreground rounded-lg shadow-sm transition-colors text-sm font-medium">Evict Cache</button>
           <button className="px-4 py-2 bg-background border border-border/50 hover:bg-muted text-foreground rounded-lg shadow-sm transition-colors text-sm font-medium">Cluster Settings</button>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mt-8">
        {[
          { label: 'Memory Usage', value: '4.4 GB' },
          { label: 'Ops/sec', value: 4900 },
          { label: 'Hit Rate (%)', value: 98.1, color: 'text-emerald-500' },
          { label: 'Miss Rate (%)', value: 1.9, color: 'text-rose-500' },
          { label: 'Connected Clients', value: 1250 },
          { label: 'Evictions', value: 0 },
        ].map((kpi, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className="rounded-2xl border border-border/50 bg-background/80 p-4 shadow-sm">
             <p className="text-sm text-muted-foreground truncate">{kpi.label}</p>
             <p className={`text-2xl font-bold mt-2 ${kpi.color || 'text-foreground'}`}>
               {typeof kpi.value === 'number' ? <AnimatedCounter value={kpi.value} /> : kpi.value}
             </p>
          </motion.div>
        ))}
      </div>

      {/* Memory & Cache Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Memory Analytics</h2>
          <InfraCard title="Memory Allocation" description="RAM utilization and fragmentation." statusColor="rose" lastUpdated="2s ago">
             <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Used Memory</p>
                   <p className="text-2xl font-bold text-rose-500">4.4 GB</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Peak Memory</p>
                   <p className="text-2xl font-bold text-foreground">5.8 GB</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Fragmentation Ratio</p>
                   <p className="text-2xl font-bold text-foreground"><AnimatedCounter value={1.05} /></p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Max Memory limits</p>
                   <p className="text-2xl font-bold text-foreground">16.0 GB</p>
                </div>
             </div>
          </InfraCard>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Cache Analytics</h2>
          <InfraCard title="Cache Efficiency" description="Hits, misses and key space." statusColor="rose" lastUpdated="2s ago">
             <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Hit Ratio</p>
                   <p className="text-2xl font-bold text-emerald-500"><AnimatedCounter value={98.1} suffix="%" /></p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Miss Ratio</p>
                   <p className="text-2xl font-bold text-amber-500"><AnimatedCounter value={1.9} suffix="%" /></p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Total Keys</p>
                   <p className="text-2xl font-bold text-foreground"><AnimatedCounter value={1425000} /></p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Expired Keys/sec</p>
                   <p className="text-2xl font-bold text-foreground"><AnimatedCounter value={14} /></p>
                </div>
             </div>
          </InfraCard>
        </div>
      </div>

      {/* Operations Monitoring */}
      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Operations Monitoring</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfraCard title="Operations per second" description="Redis commands over time." statusColor="rose">
             <div className="h-[250px] mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                      <defs>
                         <linearGradient id="colorOps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                      <Area type="monotone" dataKey="ops" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorOps)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </InfraCard>
          
          <InfraCard title="Memory Utilization" description="Memory usage (GB) over time." statusColor="rose">
             <div className="h-[250px] mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                      <defs>
                         <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                      <Area type="monotone" dataKey="memory" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorMem)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </InfraCard>
        </div>
      </div>

      {/* Recent Events */}
      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Redis Events</h2>
        <div className="p-6 rounded-2xl border border-border/50 bg-background/80 shadow-sm relative overflow-hidden">
           <div className="absolute left-10 top-10 bottom-10 w-px bg-border/50 z-0 hidden sm:block"></div>
           <div className="space-y-6 relative z-10">
              {[
                 { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', title: 'Memory Warning', time: '1 hour ago', desc: 'Memory utilization exceeded 70% threshold momentarily.' },
                 { icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: 'Client Connected', time: '2 hours ago', desc: 'New submission worker instance connected to pubsub.' },
                 { icon: UserMinus, color: 'text-blue-500', bg: 'bg-blue-500/10', title: 'Client Disconnected', time: '4 hours ago', desc: 'Idle client connection automatically closed.' },
                 { icon: Trash2, color: 'text-slate-500', bg: 'bg-slate-500/10', title: 'Key Evicted', time: '1 day ago', desc: 'LRU eviction triggered for old benchmark sessions.' },
              ].map((ev, i) => (
                 <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full ${ev.bg} ${ev.color} flex items-center justify-center shrink-0 mt-1 ring-4 ring-background hidden sm:flex`}>
                       <ev.icon className="w-4 h-4" />
                    </div>
                    <div>
                       <p className="font-semibold text-foreground flex items-center gap-2">
                         {ev.title}
                         <span className="text-xs font-normal text-muted-foreground">{ev.time}</span>
                       </p>
                       <p className="text-sm text-muted-foreground mt-1">{ev.desc}</p>
                    </div>
                 </motion.div>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}
