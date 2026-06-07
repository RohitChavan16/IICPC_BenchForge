import { Card } from '@/components/ui/Card'
import type { LiveRequest } from '@/types/api'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface LiveSampleStreamProps {
  requests: LiveRequest[]
}

const personaLabels: Record<string, string> = {
  retail: 'Retail Trader',
  market_maker: 'Market Maker',
  scalper: 'Scalper',
  whale: 'Whale',
  hft_stressor: 'HFT Stressor',
  tracer: 'Tracer Validation',
}

export function LiveSampleStream({ requests }: LiveSampleStreamProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [displayRequests, setDisplayRequests] = useState<LiveRequest[]>([])

  useEffect(() => {
    if (!isPaused && requests.length > 0) {
      setDisplayRequests(prev => {
        // Keep max 50 items to prevent DOM bloat
        const next = [...requests, ...prev]
        return next.slice(0, 50)
      })
    }
  }, [requests, isPaused])

  return (
    <Card className="flex flex-col bg-card overflow-hidden h-[400px]">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
        <h3 className="font-semibold text-card-foreground">Live Execution Stream (Sampled)</h3>
        <Button 
          variant="secondary"
          size="sm" 
          onClick={() => setIsPaused(!isPaused)}
          className={isPaused ? "bg-amber-500/20 text-amber-500" : ""}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {/* We use flex-col-reverse and overflow-y-auto so new items appear at the top smoothly */}
        <div className="absolute inset-0 overflow-y-auto p-4 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {displayRequests.map((req) => (
              <motion.div
                key={req.requestId}
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background text-sm"
              >
                <div className="flex items-center gap-3">
                  {req.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      {personaLabels[req.botType] || req.botType}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      #{req.requestId.slice(0, 8)}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className={`font-mono font-medium ${req.latency > 100000000 ? 'text-amber-500' : 'text-foreground'}`}>
                    {Math.round(req.latency / 1000000)}ms
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {req.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {displayRequests.length === 0 && (
            <div className="text-center text-muted-foreground mt-10">
              Waiting for request stream...
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
