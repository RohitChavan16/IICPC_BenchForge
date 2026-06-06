import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Settings, ArrowRight, Info, Clock } from 'lucide-react'

interface OperationsSectionProps {
  title: string
  description: string
  tooltipContent: string
  lastUpdated?: string
  statusBadge?: ReactNode
  actions?: ReactNode
  alternateBg?: boolean
  children: ReactNode
}

export function OperationsSection({
  title,
  description,
  tooltipContent,
  lastUpdated,
  statusBadge,
  actions,
  alternateBg = false,
  children
}: OperationsSectionProps) {
  const bgClass = alternateBg 
    ? 'bg-slate-50 dark:bg-slate-900/50' 
    : 'bg-white dark:bg-slate-950'

  return (
    <motion.section
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
      }}
      className={`w-full py-10 md:py-12 border-b border-slate-200 dark:border-slate-800 ${bgClass}`}
    >
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {title}
              </h2>
              {statusBadge && <div>{statusBadge}</div>}
              
              <div className="group relative ml-1 flex items-center">
                <Info size={16} className="text-slate-400 hover:text-indigo-500 cursor-help transition-colors" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-slate-800 text-sm text-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 border border-slate-700">
                  <p className="font-semibold text-white mb-1">What is this?</p>
                  <p className="text-slate-300 text-xs leading-relaxed">{tooltipContent}</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
            
            {lastUpdated && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
                <Clock size={12} />
                <span>Updated {lastUpdated}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <button className="flex items-center justify-center p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors border border-transparent dark:border-slate-700" title="Settings">
              <Settings size={16} />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-sm font-medium border border-transparent dark:border-slate-700">
              View Details
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="w-full">
          {children}
        </div>
      </div>
    </motion.section>
  )
}
