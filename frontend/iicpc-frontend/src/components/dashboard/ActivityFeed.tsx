import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Box, UploadCloud, CheckCircle, AlertCircle, Play } from 'lucide-react'
import * as submissionService from '@/services/api/submissionService'
import * as benchmarkService from '@/services/api/benchmarkService'

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const subs = await submissionService.listSubmissions()
        const benchs = await benchmarkService.fetchBenchmarkSessions()
        
        const events: any[] = []
        
        subs.forEach(s => {
          events.push({
            id: `sub-${s.id}`,
            time: new Date(s.createdAt),
            type: 'upload',
            text: `Submission "${s.submissionName}" uploaded`,
            icon: UploadCloud,
            color: 'text-muted-foreground'
          })
          if (s.status === 'BUILT') {
            events.push({
              id: `sub-b-${s.id}`,
              time: new Date(s.updatedAt),
              type: 'build',
              text: `Container build successful for "${s.submissionName}"`,
              icon: Box,
              color: 'text-emerald-400'
            })
          }
        })

        benchs.items.forEach((b: any) => {
          events.push({
            id: `bench-${b.id}`,
            time: new Date(b.createdAt),
            type: 'benchmark',
            text: `Benchmark started for "${b.name}"`,
            icon: Play,
            color: 'text-primary'
          })
          if (b.status === 'COMPLETED') {
            events.push({
              id: `bench-c-${b.id}`,
              time: new Date(b.updatedAt),
              type: 'benchmark',
              text: `Benchmark completed for "${b.name}"`,
              icon: CheckCircle,
              color: 'text-emerald-400'
            })
          } else if (b.status === 'FAILED') {
            events.push({
              id: `bench-f-${b.id}`,
              time: new Date(b.updatedAt),
              type: 'error',
              text: `Benchmark failed for "${b.name}"`,
              icon: AlertCircle,
              color: 'text-rose-400'
            })
          }
        })

        events.sort((a, b) => b.time.getTime() - a.time.getTime())
        
        setActivities(events.slice(0, 8))
      } catch (err) {
        console.error('Failed to load activities', err)
      }
    }
    
    loadEvents()
    const interval = setInterval(loadEvents, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card title="Activity Feed" description="Real-time events from the benchmark engine.">
      <div className="mt-6 space-y-6">
        {activities.map((activity, idx) => (
          <div key={activity.id} className="relative flex gap-4">
            {/* Timeline connector line */}
            {idx !== activities.length - 1 && (
              <div className="absolute left-[19px] top-[32px] bottom-[-24px] w-px bg-muted" />
            )}
            
            <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card ${activity.color}`}>
              <activity.icon size={16} />
            </div>
            
            <div className="flex flex-col pt-2">
              <p className="text-sm font-medium text-foreground">{activity.text}</p>
              <p className="mt-1 text-xs text-foreground0">{activity.time.toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
