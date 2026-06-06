import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Activity, Server, Database } from 'lucide-react'

interface OperationsPageContainerProps {
  children: ReactNode
}

function SystemStatusStrip() {
  return (
    <div className="w-full bg-slate-900 text-slate-300 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs font-medium z-50 relative">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          All Systems Operational
        </div>
        <div className="hidden sm:flex items-center gap-3 opacity-80">
          <div className="flex items-center gap-1"><Server size={12} /> 12 Nodes Active</div>
          <div className="flex items-center gap-1"><Activity size={12} /> 4,102 TPS</div>
        </div>
      </div>
      <div className="flex items-center gap-4 opacity-80">
        <div className="hidden sm:flex items-center gap-1 text-emerald-400"><Database size={12} /> Redis: Connected</div>
        <div className="flex items-center gap-1">v1.2.4-prod</div>
      </div>
    </div>
  )
}

export function OperationsPageContainer({ children }: OperationsPageContainerProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <SystemStatusStrip />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        className="w-full flex flex-col"
      >
        {children}
      </motion.div>
    </div>
  )
}
