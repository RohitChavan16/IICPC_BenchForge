import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, PlayCircle, BarChart2, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface SubmissionActionGroupProps {
  submissionId: string
  benchmarkId?: string
  isCompleted: boolean
}

export function SubmissionActionGroup({ submissionId, benchmarkId, isCompleted }: SubmissionActionGroupProps) {
  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Link to={`/submissions/${submissionId}/report`} className="group relative">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 bg-muted/50 hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-lg text-muted-foreground hover:text-primary transition-colors focus:outline-none"
        >
          <FileText size={16} />
        </motion.button>
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-800 text-zinc-100 text-[10px] font-semibold py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          View Report
        </span>
      </Link>

      {isCompleted && (
        <Link to={`/submissions/${submissionId}/replay`} className="group relative">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-muted/50 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 rounded-lg text-muted-foreground hover:text-violet-500 transition-colors focus:outline-none"
          >
            <PlayCircle size={16} />
          </motion.button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-800 text-zinc-100 text-[10px] font-semibold py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            Replay
          </span>
        </Link>
      )}

      {benchmarkId && (
        <Link to={`/benchmarks/${benchmarkId}`} className="group relative">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-muted/50 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 rounded-lg text-muted-foreground hover:text-cyan-500 transition-colors focus:outline-none"
          >
            <BarChart2 size={16} />
          </motion.button>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-800 text-zinc-100 text-[10px] font-semibold py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            Open Benchmark
          </span>
        </Link>
      )}

      <div className="group relative">
        <motion.button 
          disabled
          className="p-2 bg-muted/20 border border-transparent rounded-lg text-muted-foreground/30 cursor-not-allowed focus:outline-none"
        >
          <Trash2 size={16} />
        </motion.button>
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-800 text-zinc-100 text-[10px] font-semibold py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          Delete unavailable
        </span>
      </div>
    </div>
  )
}
