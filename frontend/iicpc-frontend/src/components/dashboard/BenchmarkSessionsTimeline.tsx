import React, { useEffect, useState } from 'react';
import { SectionWrapper } from './SectionWrapper';
import { CheckCircle2, XCircle, PlayCircle, Clock, Server, Users, Eye, Play, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchBenchmarkSessions } from '@/services/api/benchmarkService';
import type { BenchmarkSession } from '@/types/api';

export function BenchmarkSessionsTimeline() {
  const [sessions, setSessions] = useState<BenchmarkSession[]>([]);

  useEffect(() => {
    fetchBenchmarkSessions().then(res => setSessions(res.items.slice(0, 5))).catch(console.error);
  }, []);

  const actions = (
    <Link to="/benchmarks" className="text-sm font-medium text-primary hover:underline">
      View All Sessions
    </Link>
  );

  return (
    <SectionWrapper 
      title="Benchmark Sessions" 
      description="Execution history mapped to worker allocations."
      actions={actions}
      className="mb-8"
    >
      <div className="space-y-4">
        {sessions.map((session, i) => {
          const isSuccess = session.status === 'Completed';
          const Icon = isSuccess ? CheckCircle2 : XCircle;
          const colorClass = isSuccess ? 'text-emerald-500' : 'text-rose-500';
          const bgClass = isSuccess ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20';
          const replayAvailable = session.status === 'Completed';

          return (
            <div key={session.id} className={`flex items-stretch gap-4 p-4 rounded-xl border ${bgClass} hover:bg-muted/10 transition-colors group`}>
              <div className="flex-shrink-0 pt-1">
                <Icon className={colorClass} size={24} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{session.id.split('-')[0]}</span>
                    <span className="text-muted-foreground text-xs font-mono px-2 py-0.5 bg-background border border-border rounded-full shadow-sm">{session.name}</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="px-2 py-1 text-xs rounded bg-background border border-border hover:bg-muted flex items-center gap-1 font-medium"><Eye size={12}/> View</button>
                     {replayAvailable && <button className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 font-medium"><Play size={12}/> Replay</button>}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock size={14} /> {session.duration || '-'}s</span>
                  <span className="flex items-center gap-1"><Server size={14} /> {session.workerCount} Workers</span>
                  <span className="flex items-center gap-1"><Users size={14} /> - Mix</span>
                  {replayAvailable && <span className="flex items-center gap-1 text-purple-500"><PlayCircle size={14} /> Replay Ready</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
