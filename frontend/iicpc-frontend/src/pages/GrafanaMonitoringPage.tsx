import { motion } from 'framer-motion'
import { Activity, BarChart2, Cpu, Database, Server, Settings, Zap } from 'lucide-react'
import { InfrastructureStatusStrip } from '@/components/admin/infra/InfrastructureStatusStrip'
import { InfraCard } from '@/components/admin/infra/InfraCard'
import { AnimatedCounter } from '@/components/admin/infra/AnimatedCounter'

export function GrafanaMonitoringPage() {
  const dashboards = [
    { name: 'Infrastructure Dashboard', icon: Server, desc: 'Nodes, Containers, Network', updated: '2m ago' },
    { name: 'TPS Dashboard', icon: Zap, desc: 'Transactions Per Second across services', updated: '1m ago' },
    { name: 'Redis Dashboard', icon: Database, desc: 'Cache hits, memory, evictions', updated: '30s ago' },
    { name: 'Postgres Dashboard', icon: Database, desc: 'Queries, connections, deadlocks', updated: '15s ago' },
    { name: 'Worker Dashboard', icon: Cpu, desc: 'Worker pool utilization & active jobs', updated: '1m ago' },
    { name: 'Queue Dashboard', icon: Activity, desc: 'Submission processing & lag', updated: '45s ago' },
  ]

  return (
    <div className="space-y-8 pb-12">
      <InfrastructureStatusStrip />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-orange-500 font-semibold">Grafana Observability</p>
        <h1 className="text-4xl font-bold text-foreground">Grafana Monitoring Center</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">Unified observability across BenchForge infrastructure. Embedded views into core platform metrics and operational health.</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Dashboards', value: 24 },
          { label: 'Triggered Alerts', value: 2, color: 'text-amber-500' },
          { label: 'Monitoring Coverage (%)', value: 98 },
          { label: 'Infra Health Score (%)', value: 99, color: 'text-emerald-500' },
        ].map((kpi, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className="rounded-2xl border border-border/50 bg-background/80 p-5 shadow-sm">
             <p className="text-sm text-muted-foreground">{kpi.label}</p>
             <p className={`text-3xl font-bold mt-2 ${kpi.color || 'text-foreground'}`}>
               <AnimatedCounter value={kpi.value} />
             </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dash, i) => (
             <motion.div key={dash.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="h-full">
               <InfraCard title={dash.name} description={dash.desc} statusColor="orange" lastUpdated={dash.updated} onViewDetailsClick={() => {}}>
                  <div className="flex items-center justify-center py-8">
                     <dash.icon className="w-12 h-12 text-orange-500/20" />
                     <span className="ml-4 font-medium text-muted-foreground">Open Dashboard</span>
                  </div>
               </InfraCard>
             </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <div className="space-y-4">
           <h2 className="text-2xl font-bold text-foreground">Monitoring Categories</h2>
           <div className="flex flex-col gap-3">
             {['Infrastructure', 'Database', 'Caching', 'Queue', 'Workers', 'Benchmarking'].map((cat) => (
               <motion.div key={cat} whileHover={{ x: 4 }} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background hover:bg-muted/50 cursor-pointer transition-colors">
                 <span className="font-medium text-foreground">{cat}</span>
                 <Settings className="w-4 h-4 text-muted-foreground" />
               </motion.div>
             ))}
           </div>
        </div>

        <div className="space-y-4">
           <h2 className="text-2xl font-bold text-foreground">Alert Center</h2>
           <div className="space-y-3">
             <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 flex items-start gap-3">
                <Activity className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">High Memory Usage</p>
                  <p className="text-sm opacity-90">Worker Node 3 exceeded 90% memory threshold.</p>
                </div>
             </div>
             <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500 flex items-start gap-3">
                <Database className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">Slow Queries Detected</p>
                  <p className="text-sm opacity-90">Avg query latency {'>'} 200ms on Submission Service.</p>
                </div>
             </div>
             <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 flex items-start gap-3">
                <Server className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">Auto-scaling complete</p>
                  <p className="text-sm opacity-90">Provisioned 2 new worker instances successfully.</p>
                </div>
             </div>
           </div>
        </div>
      </div>
      
      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Observability Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <InfraCard title="Most Active Service" description="Service with highest traffic" statusColor="blue">
             <div className="py-4 text-center">
                <p className="text-2xl font-bold text-blue-500">Submission API</p>
             </div>
          </InfraCard>
          <InfraCard title="Highest TPS" description="Peak transactions per second" statusColor="emerald">
             <div className="py-4 text-center">
                <p className="text-2xl font-bold text-emerald-500">
                  <AnimatedCounter value={1240} suffix=" req/s" />
                </p>
             </div>
          </InfraCard>
          <InfraCard title="Resource Bottleneck" description="Highest constrained resource" statusColor="amber">
             <div className="py-4 text-center">
                <p className="text-2xl font-bold text-amber-500">Redis Memory</p>
             </div>
          </InfraCard>
          <InfraCard title="Platform Health Score" description="Calculated aggregate health" statusColor="emerald">
             <div className="py-4 text-center">
                <p className="text-2xl font-bold text-emerald-500">A+</p>
             </div>
          </InfraCard>
        </div>
      </div>
    </div>
  )
}
