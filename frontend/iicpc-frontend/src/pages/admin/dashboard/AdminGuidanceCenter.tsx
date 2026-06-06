import { motion } from 'framer-motion'
import { BookOpen, FileCode, ListFilter, Server, LineChart, Calculator, Users } from 'lucide-react'

const steps = [
  { icon: Users, title: '1. Teams', desc: 'Manages contestants and team registration.' },
  { icon: FileCode, title: '2. Submissions', desc: 'Shows all team submissions and their current pipeline status.' },
  { icon: ListFilter, title: '3. Queue Manager', desc: 'Monitors pending and active workloads in the benchmark queue.' },
  { icon: Server, title: '4. Infrastructure', desc: 'Monitors Redis, PostgreSQL, and cluster health metrics.' },
  { icon: LineChart, title: '5. Analytics', desc: 'Provides performance distribution and correctness insights.' },
  { icon: Calculator, title: '6. Platform Control', desc: 'Manages scoring engine configuration and deployment parameters.' },
]

export function AdminGuidanceCenter() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.45 }}
      className="flex flex-col rounded-xl border border-indigo-200/50 bg-indigo-50/30 shadow-sm dark:border-indigo-900/30 dark:bg-slate-900 overflow-hidden"
    >
      <div className="border-b border-indigo-100/50 p-5 dark:border-indigo-900/30 flex items-center gap-3 bg-white/50 dark:bg-slate-800/20 backdrop-blur-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <BookOpen size={18} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Admin Quick Guide</h2>
      </div>
      
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon
          return (
            <motion.div 
              key={step.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + idx * 0.05 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <Icon size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{step.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
