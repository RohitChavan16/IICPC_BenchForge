import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface KPICardData {
  id: string
  label: string
  value: string | number
  explanation: string
  trend: string
  trendType?: 'up' | 'down' | 'neutral'
  icon: ReactNode
  colorClass: string
}

interface OperationsKPIGridProps {
  metrics: KPICardData[]
}

export function OperationsKPIGrid({ metrics }: OperationsKPIGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-stretch">
      {metrics.map((metric, idx) => (
        <motion.div
          key={metric.id}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
          className="flex flex-col p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group h-full"
        >
          {/* Subtle glass gradient effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 ${metric.colorClass}`}>
                {metric.icon}
              </div>
              
              {metric.trend && (
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  metric.trendType === 'up' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' :
                  metric.trendType === 'down' ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10' :
                  'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                }`}>
                  {metric.trendType === 'up' && <TrendingUp size={12} />}
                  {metric.trendType === 'down' && <TrendingDown size={12} />}
                  {metric.trendType === 'neutral' && <Minus size={12} />}
                  {metric.trend}
                </div>
              )}
            </div>
            
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{metric.label}</h3>
            
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{metric.value}</span>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-auto leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
              {metric.explanation}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
