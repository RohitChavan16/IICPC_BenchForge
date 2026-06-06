import React from 'react'
import { motion } from 'framer-motion'
import { Info, Settings } from 'lucide-react'

interface InfraCardProps {
  title: string;
  description: string;
  lastUpdated?: string;
  statusColor?: 'emerald' | 'amber' | 'rose' | 'blue' | 'indigo' | 'slate' | 'orange';
  onSettingsClick?: () => void;
  onViewDetailsClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const statusColorMap = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  slate: 'bg-slate-500',
  orange: 'bg-orange-500',
}

export function InfraCard({
  title,
  description,
  lastUpdated,
  statusColor = 'emerald',
  onSettingsClick,
  onViewDetailsClick,
  children,
  className = ''
}: InfraCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-visible rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {title}
              <div className="group relative flex items-center justify-center">
                <Info className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-48 p-2 bg-slate-800 text-slate-100 text-xs rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-center pointer-events-none">
                  ⓘ {description}
                </div>
              </div>
            </h3>
            {statusColor && (
              <span className="relative flex h-2.5 w-2.5 ml-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColorMap[statusColor]}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusColorMap[statusColor]}`}></span>
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
        <div className="flex items-center gap-2">
           {onSettingsClick && (
             <button onClick={onSettingsClick} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" aria-label="Settings">
               <Settings className="w-4 h-4" />
             </button>
           )}
        </div>
      </div>
      
      <div className="flex-1">
        {children}
      </div>

      {(lastUpdated || onViewDetailsClick) && (
        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs">
          {lastUpdated ? (
            <span className="text-muted-foreground font-medium">Last Updated: {lastUpdated}</span>
          ) : <span />}
          {onViewDetailsClick && (
            <button onClick={onViewDetailsClick} className="text-primary hover:text-primary/80 font-medium transition-colors">
              View Details
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
