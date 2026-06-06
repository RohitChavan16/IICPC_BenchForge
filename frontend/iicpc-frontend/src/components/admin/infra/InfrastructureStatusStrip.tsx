import { motion } from 'framer-motion'

interface ServiceStatus {
  name: string;
  status: 'Healthy' | 'Warning' | 'Critical';
}

const mockStatuses: ServiceStatus[] = [
  { name: 'Redis', status: 'Healthy' },
  { name: 'Postgres', status: 'Healthy' },
  { name: 'Telemetry', status: 'Healthy' },
  { name: 'Workers', status: 'Warning' },
  { name: 'Queue', status: 'Healthy' },
  { name: 'Deployments', status: 'Healthy' },
]

export function InfrastructureStatusStrip() {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-8 p-3 rounded-xl border border-border/50 bg-background/50 backdrop-blur-md">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2 ml-1">
        Infrastructure Status
      </div>
      {mockStatuses.map((service, idx) => {
        const isHealthy = service.status === 'Healthy'
        const isWarning = service.status === 'Warning'
        const colorClass = isHealthy ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
        const textColor = isHealthy ? 'text-emerald-500' : isWarning ? 'text-amber-500' : 'text-rose-500'

        return (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={service.name} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-border/30 text-sm shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorClass}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${colorClass}`}></span>
            </span>
            <span className="font-medium text-foreground">{service.name}</span>
            <span className={`text-xs font-semibold ${textColor}`}>{service.status}</span>
          </motion.div>
        )
      })}
    </div>
  )
}
