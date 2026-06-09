import React from 'react';
import { SectionWrapper } from './SectionWrapper';
import { mockReplayHighlights } from '@/data/mockDashboardData';
import { Play, AlertTriangle, ShieldCheck, Clock, ArrowRight, UserX, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ReplayHighlightsSnapshot() {
  const data = mockReplayHighlights;

  const actions = (
    <Link to="/replays/latest" className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500 hover:text-white transition-colors text-sm font-medium">
      <Play size={16} />
      Watch Replay
    </Link>
  );

  return (
    <SectionWrapper 
      title="Replay Highlights" 
      description="Insights from your most recent benchmark run."
      badgeLabel={data.status}
      badgeVariant="info"
      actions={actions}
      className="mb-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Col: Key Findings */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-border bg-purple-50/50 dark:bg-purple-950/10 flex flex-col justify-between">
              <span className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500"/> Recovery Events</span>
              <span className="text-2xl font-bold">{data.recoveryEvents}</span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-purple-50/50 dark:bg-purple-950/10 flex flex-col justify-between">
              <span className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-2"><ShieldCheck size={14} className="text-rose-500"/> Anomalies</span>
              <span className="text-2xl font-bold">{data.anomaliesDetected}</span>
            </div>
          </div>
          
          <div className="p-4 rounded-xl border border-border bg-muted/20">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><UserX size={16} className="text-rose-500"/> Worst Persona</span>
              <span className="text-sm font-bold">{data.worstPersona}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2"><UserCheck size={16} className="text-emerald-500"/> Best Persona</span>
              <span className="text-sm font-bold">{data.bestPersona}</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Clock size={12}/> Available for {data.availability}
          </p>
        </div>

        {/* Right Col: Mini Timeline Preview */}
        <div className="relative pl-6 border-l-2 border-muted">
          <h4 className="text-sm font-semibold mb-4 text-foreground">Timeline Preview</h4>
          <div className="space-y-4">
            {data.timeline.map((event, i) => {
              let dotColor = "bg-muted border-muted-foreground";
              if (event.type === 'start' || event.type === 'end') dotColor = "bg-blue-500/20 border-blue-500";
              if (event.type === 'anomaly') dotColor = "bg-rose-500/20 border-rose-500";
              if (event.type === 'recovery') dotColor = "bg-emerald-500/20 border-emerald-500";

              return (
                <div key={i} className="relative">
                  <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 ${dotColor} bg-background`} />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">{event.label}</span>
                    <span className="text-[10px] text-muted-foreground">{event.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/replays/latest" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-purple-500 hover:text-purple-600">
            View full timeline <ArrowRight size={14}/>
          </Link>
        </div>

      </div>
    </SectionWrapper>
  );
}
