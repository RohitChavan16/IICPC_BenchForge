import { motion } from 'framer-motion'
import { Database, Network, Clock, Activity, HardDrive, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { InfrastructureStatusStrip } from '@/components/admin/infra/InfrastructureStatusStrip'
import { InfraCard } from '@/components/admin/infra/InfraCard'
import { AnimatedCounter } from '@/components/admin/infra/AnimatedCounter'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export function PostgresMonitoringPage() {
  const chartData = [
    { time: '10:00', tps: 1200, latency: 15, connections: 45 },
    { time: '10:05', tps: 1350, latency: 18, connections: 48 },
    { time: '10:10', tps: 1100, latency: 14, connections: 42 },
    { time: '10:15', tps: 2400, latency: 45, connections: 85 },
    { time: '10:20', tps: 1800, latency: 25, connections: 60 },
    { time: '10:25', tps: 1450, latency: 16, connections: 47 },
    { time: '10:30', tps: 1300, latency: 15, connections: 45 },
  ]

  return (
    <div className="space-y-8 pb-12">
      <InfrastructureStatusStrip />

      {/* Hero Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-500 font-semibold">PostgreSQL Observability</p>
        <h1 className="text-4xl font-bold text-foreground">PostgreSQL Metrics</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">Monitor database health, throughput, query performance and connection utilization.</p>
        <div className="flex gap-4 mt-4">
           <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium">Open in pgAdmin</button>
           <button className="px-4 py-2 bg-background border border-border/50 hover:bg-muted text-foreground rounded-lg shadow-sm transition-colors text-sm font-medium">Query Logs</button>
           <button className="px-4 py-2 bg-background border border-border/50 hover:bg-muted text-foreground rounded-lg shadow-sm transition-colors text-sm font-medium">Database Settings</button>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mt-8">
        {[
          { label: 'Active Connections', value: 45 },
          { label: 'Queries/sec', value: 1450 },
          { label: 'Transactions/sec', value: 342 },
          { label: 'Database Size (GB)', value: 142 },
          { label: 'Replication Status', value: 'Synced', color: 'text-emerald-500' },
          { label: 'Cache Hit Ratio (%)', value: 99.4, color: 'text-blue-500' },
        ].map((kpi, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className="rounded-2xl border border-border/50 bg-background/80 p-4 shadow-sm">
             <p className="text-sm text-muted-foreground truncate">{kpi.label}</p>
             <p className={`text-2xl font-bold mt-2 ${kpi.color || 'text-foreground'}`}>
               {typeof kpi.value === 'number' ? <AnimatedCounter value={kpi.value} /> : kpi.value}
             </p>
          </motion.div>
        ))}
      </div>

      {/* Connection Analytics & Query Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Connection Analytics</h2>
          <InfraCard title="Connection Pool" description="Connection utilization and limits." statusColor="blue" lastUpdated="5s ago">
             <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Active</p>
                   <p className="text-2xl font-bold text-blue-500"><AnimatedCounter value={45} /></p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Idle</p>
                   <p className="text-2xl font-bold text-foreground"><AnimatedCounter value={12} /></p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Max Allowed</p>
                   <p className="text-2xl font-bold text-foreground">500</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Usage</p>
                   <p className="text-2xl font-bold text-emerald-500"><AnimatedCounter value={11.4} suffix="%" /></p>
                </div>
             </div>
          </InfraCard>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Query Analytics</h2>
          <InfraCard title="Query Performance" description="Latencies and blocked queries." statusColor="blue" lastUpdated="10s ago">
             <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Avg Query Time</p>
                   <p className="text-2xl font-bold text-blue-500"><AnimatedCounter value={15} suffix="ms" /></p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Slow Queries</p>
                   <p className="text-2xl font-bold text-amber-500">2</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Blocked Queries</p>
                   <p className="text-2xl font-bold text-foreground">0</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                   <p className="text-sm text-muted-foreground">Top Query Latency</p>
                   <p className="text-2xl font-bold text-amber-500"><AnimatedCounter value={214} suffix="ms" /></p>
                </div>
             </div>
          </InfraCard>
        </div>
      </div>

      {/* Performance Monitoring */}
      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Performance Monitoring</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfraCard title="Transactions per second" description="Historical TPS over the last hour." statusColor="blue">
             <div className="h-[250px] mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                      <defs>
                         <linearGradient id="colorTps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                      <Area type="monotone" dataKey="tps" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTps)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </InfraCard>
          
          <InfraCard title="Query Latency" description="Average query latency (ms) over time." statusColor="amber">
             <div className="h-[250px] mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                      <defs>
                         <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }} />
                      <Area type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorLat)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </InfraCard>
        </div>
      </div>

      {/* Recent Events */}
      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Recent Events</h2>
        <div className="p-6 rounded-2xl border border-border/50 bg-background/80 shadow-sm relative overflow-hidden">
           <div className="absolute left-10 top-10 bottom-10 w-px bg-border/50 z-0 hidden sm:block"></div>
           <div className="space-y-6 relative z-10">
              {[
                 { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', title: 'Connection Spike', time: '20 mins ago', desc: 'Active connections peaked at 85 during high load.' },
                 { icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10', title: 'Slow Query Alert', time: '35 mins ago', desc: 'Submission lookup query exceeded 200ms latency threshold.' },
                 { icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: 'Backup Completed', time: '2 hours ago', desc: 'Automated WAL archiving and daily snapshot completed.' },
                 { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10', title: 'Replication Synced', time: '3 hours ago', desc: 'Read replica delay recovered to <1ms.' },
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
