import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface SectionWrapperProps {
  title: string;
  description: string;
  badgeLabel?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  actions?: React.ReactNode;
  children: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export function SectionWrapper({
  title,
  description,
  badgeLabel,
  badgeVariant = 'info',
  actions,
  children,
  expandable = false,
  defaultExpanded = true,
  className = ''
}: SectionWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      <div className="p-6 border-b border-border bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
              {badgeLabel && (
                <Badge variant={badgeVariant} className="uppercase tracking-wider text-[10px] shadow-sm">
                  {badgeLabel}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {actions}
            {expandable && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label={isExpanded ? "Collapse section" : "Expand section"}
              >
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>
      
      <AnimatePresence initial={false}>
        {(!expandable || isExpanded) && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
