import { motion } from 'framer-motion'
import { Activity, Cpu, Database, Network, HardDrive, RefreshCw, PlusCircle, CheckCircle2 } from 'lucide-react'
import { InfrastructureStatusStrip } from '@/components/admin/infra/InfrastructureStatusStrip'
import { InfraCard } from '@/components/admin/infra/InfraCard'
import { AnimatedCounter } from '@/components/admin/infra/AnimatedCounter'

export function InfrastructureMonitoringPage() {
  const platformServices = [
    { name: 'Submission Service', health: 'Healthy', latency: '42ms', tps: 342, errors: '0.01%', uptime: '99.99%', updated: '10s ago' },
    { name: 'Benchmark Service', health: 'Healthy', latency: '112ms', tps: 85, errors: '0.05%', uptime: '99.95%', updated: '12s ago' },
    { name: 'Leaderboard Service', health: 'Healthy', latency: '15ms', tps: 1200, errors: '0.00%', uptime: '100%', updated: '5s ago' },
    { name: 'Telemetry Service', health: 'Healthy', latency: '8ms', tps: 4500, errors: '0.02%', uptime: '99.98%', updated: '2s ago' },
    { name: 'Queue Service', health: 'Healthy', latency: '22ms', tps: 850, errors: '0.00%', uptime: '100%', updated: '8s ago' },
    { name: 'Worker Pool', health: 'Warning', latency: 'N/A', tps: 45, errors: '1.20%', uptime: '99.50%', updated: '15s ago' },
  ]

  return (
    <div className="space-y-8 pb-12">
      <InfrastructureStatusStrip />

      {/* Hero Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-500 font-semibold">System Health</p>
        <h1 className="text-4xl font-bold text-foreground">Infrastructure Operations Center</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">Monitor the health, performance and availability of every BenchForge component.</p>
        <div className="flex gap-4 mt-4">
           <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium">Open Grafana</button>
           <button className="px-4 py-2 bg-background border border-border/50 hover:bg-muted text-foreground rounded-lg shadow-sm transition-colors text-sm font-medium">View Logs</button>
           <button className="px-4 py-2 bg-background border border-border/50 hover:bg-muted text-foreground rounded-lg shadow-sm transition-colors text-sm font-medium">Infrastructure Settings</button>
           <button className="px-4 py-2 bg-background border border-border/50 hover:bg-muted text-foreground rounded-lg shadow-sm transition-colors text-sm font-medium">View Incidents</button>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[
          { label: 'System Uptime', value: '99.99%', color: 'text-emerald-500' },
          { label: 'Active Services', value: 24 },
          { label: 'Infrastructure Health', value: 'Optimal', color: 'text-emerald-500' },
          { label: 'Current Platform TPS', value: 4520 },
        ].map((kpi, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className="rounded-2xl border border-border/50 bg-background/80 p-5 shadow-sm">
             <p className="text-sm text-muted-foreground">{kpi.label}</p>
             <p className={`text-3xl font-bold mt-2 ${kpi.color || 'text-foreground'}`}>
               {typeof kpi.value === 'number' ? <AnimatedCounter value={kpi.value} /> : kpi.value}
             </p>
          </motion.div>
        ))}
      </div>

      {/* Platform Services Grid */}
      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Platform Services Grid</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {platformServices.map((svc, i) => (
             <motion.div key={svc.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="h-full">
               <InfraCard 
                  title={svc.name} 
                  description="Core platform microservice telemetry and health status." 
                  statusColor={svc.health === 'Healthy' ? 'emerald' : 'amber'} 
                  lastUpdated={svc.updated} 
                  onViewDetailsClick={() => {}}
                  onSettingsClick={() => {}}
               >
                  <div className="grid grid-cols-2 gap-4 mt-4">
                     <div>
                        <p className="text-xs text-muted-foreground">Latency</p>
                        <p className="text-lg font-semibold text-foreground">{svc.latency}</p>
                     </div>
                     <div>
                        <p className="text-xs text-muted-foreground">Requests/sec</p>
                        <p className="text-lg font-semibold text-foreground">
                           <AnimatedCounter value={svc.tps} />
                        </p>
                     </div>
                     <div>
                        <p className="text-xs text-muted-foreground">Errors</p>
                        <p className={`text-lg font-semibold ${svc.errors === '0.00%' ? 'text-foreground' : 'text-amber-500'}`}>{svc.errors}</p>
                     </div>
                     <div>
                        <p className="text-xs text-muted-foreground">Uptime</p>
                        <p className="text-lg font-semibold text-emerald-500">{svc.uptime}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 mt-6">
                     <button className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">Logs</button>
                     <span className="w-1 h-1 rounded-full bg-border"></span>
                     <button className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">Metrics</button>
                  </div>
               </InfraCard>
             </motion.div>
          ))}
        </div>
      </div>

      {/* Resource Utilization */}
      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Resource Utilization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
             { name: 'CPU', val: 42, icon: Cpu },
             { name: 'Memory', val: 78, icon: Database },
             { name: 'Network', val: 35, icon: Network },
             { name: 'Disk', val: 65, icon: HardDrive },
          ].map((res, i) => (
             <motion.div key={res.name} whileHover={{ y: -4 }} className="p-6 rounded-2xl border border-border/50 bg-background/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                   <p className="font-semibold text-foreground flex items-center gap-2">
                     <res.icon className="w-4 h-4 text-muted-foreground" />
                     {res.name}
                   </p>
                   <span className="text-xl font-bold text-foreground"><AnimatedCounter value={res.val} suffix="%" /></span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${res.val}%` }} 
                     transition={{ duration: 1, ease: 'easeOut' }}
                     className={`h-full ${res.val > 80 ? 'bg-rose-500' : res.val > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                   />
                </div>
             </motion.div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Infrastructure Activity Feed</h2>
        <div className="p-6 rounded-2xl border border-border/50 bg-background/80 shadow-sm relative overflow-hidden">
           <div className="absolute left-10 top-10 bottom-10 w-px bg-border/50 z-0 hidden sm:block"></div>
           <div className="space-y-6 relative z-10">
              {[
                 { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10', title: 'Service Restarted', time: '2 mins ago', desc: 'Worker Pool nodes rotated successfully.' },
                 { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: 'Deployment Completed', time: '15 mins ago', desc: 'v1.4.2 released to production.' },
                 { icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: 'Database Reconnected', time: '1 hour ago', desc: 'PostgreSQL connection pool stabilized.' },
                 { icon: PlusCircle, color: 'text-indigo-500', bg: 'bg-indigo-500/10', title: 'Worker Connected', time: '2 hours ago', desc: 'Node worker-05 joined the pool.' },
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
