import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export interface ActivityFeedItem {
  id: string | number
  title: string
  description: string
  time: string
  icon: ReactNode
  colorClass: string
  bgClass: string
  isPulse?: boolean
}

interface OperationsActivityFeedProps {
  items: ActivityFeedItem[]
  maxHeight?: string
}

export function OperationsActivityFeed({ items, maxHeight = '400px' }: OperationsActivityFeedProps) {
  return (
    <div 
      className="w-full overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full"
      style={{ maxHeight }}
    >
      <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-6 pb-4">
        {items.map((item, idx) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
            className="relative pl-6 group"
          >
            <div className={`absolute -left-[17px] flex h-8 w-8 items-center justify-center rounded-full border-4 border-white dark:border-slate-950 ${item.bgClass} ${item.colorClass} transition-transform group-hover:scale-110`}>
              <div className={item.isPulse ? 'animate-pulse' : ''}>
                {item.icon}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
              <span className="text-[10px] font-medium text-slate-400 shrink-0">{item.time}</span>
            </div>
            
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
