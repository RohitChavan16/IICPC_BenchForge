import React from 'react';
import type { LifecycleEvent } from '@/types/api';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface LifecycleTrackProps {
  events: LifecycleEvent[];
  currentStatus: string;
}

export function LifecycleTrack({ events, currentStatus }: LifecycleTrackProps) {
  const phases = ['UPLOAD', 'BUILD', 'DEPLOY', 'VALIDATION', 'BENCHMARK'];
  
  return (
    <Card className="bg-slate-900 border-slate-800 mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {phases.map((phase, idx) => {
            const event = events.find(e => e.phase === phase);
            const isCompleted = event?.status === 'SUCCESS';
            const isFailed = event?.status === 'FAILED';
            const isActive = !event && currentStatus === phase;

            return (
              <React.Fragment key={phase}>
                <div className="flex flex-col items-center relative z-10 w-24">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                    isCompleted ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' :
                    isFailed ? 'bg-rose-500/20 border-rose-500 text-rose-500' :
                    isActive ? 'bg-blue-500/20 border-blue-500 text-blue-500 animate-pulse' :
                    'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    {isCompleted ? <CheckCircle size={20} /> :
                     isFailed ? <XCircle size={20} /> :
                     <Clock size={20} />}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider text-center ${
                    isCompleted ? 'text-emerald-400' :
                    isFailed ? 'text-rose-400' :
                    isActive ? 'text-blue-400' :
                    'text-slate-500'
                  }`}>
                    {phase}
                  </span>
                  {event && (
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  )}
                </div>
                {idx < phases.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full ${
                    isCompleted ? 'bg-emerald-500/50' : 'bg-slate-800'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
