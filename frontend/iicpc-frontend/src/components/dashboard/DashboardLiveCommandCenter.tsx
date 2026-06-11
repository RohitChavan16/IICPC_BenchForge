import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SectionWrapper } from './SectionWrapper';
import { Play, FileText, Activity, Trophy, Server, Users, List, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSharedWebsocketClient } from '@/services/websocket/websocketClient';
import type { WebSocketStatus } from '@/services/websocket/websocketClient';
import type { MetricSnapshot, PersonaMetricMap } from '@/types/api';

export function DashboardLiveCommandCenter() {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [snapshot, setSnapshot] = useState<MetricSnapshot | null>(null);
  const [personas, setPersonas] = useState<PersonaMetricMap>({});

  useEffect(() => {
    const ws = getSharedWebsocketClient(import.meta.env.VITE_WS_URL || 'ws://localhost:8081/ws');
    
    setStatus(ws.getStatus());
    setSnapshot(ws.getLatestSnapshot());
    setPersonas(ws.getLatestPersonas());

    const handleStatus = (s: WebSocketStatus) => setStatus(s);
    const handleSnapshot = (data: MetricSnapshot) => setSnapshot(data);
    const handlePersonas = (data: PersonaMetricMap) => setPersonas(data);

    ws.addStatusHandler(handleStatus);
    ws.addHandler(handleSnapshot);
    ws.addPersonaHandler(handlePersonas);
    ws.connect();

    return () => {
      ws.removeStatusHandler(handleStatus);
      ws.removeHandler(handleSnapshot);
      ws.removePersonaHandler(handlePersonas);
    };
  }, []);

  const isLive = status === 'connected';
  
  const formatPersonaMix = (map: PersonaMetricMap) => {
    const keys = Object.keys(map);
    if (keys.length === 0) return '-';
    return keys.map(k => `${k}: ${Math.floor(map[k].tps)} TPS`).join(', ');
  };

  const liveStats = {
    stage: '-',
    tps: snapshot ? Math.floor(snapshot.tps).toLocaleString() : '-',
    p99: snapshot ? `${Math.floor(snapshot.p99)}ms` : '-',
    success: snapshot ? `${((1 - snapshot.failureRate) * 100).toFixed(1)}%` : '-',
    workerUtilization: '-',
    queueDepth: '-',
    personaMix: formatPersonaMix(personas)
  };

  const actions = (
    <div className="flex gap-2">
      <Link to="/submissions" className="p-2 bg-background border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="View Submission">
        <FileText size={16} />
      </Link>
      <Link to="/telemetry" className="p-2 bg-background border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Open Telemetry">
        <Activity size={16} />
      </Link>
      <Link to="/leaderboard" className="p-2 bg-background border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Leaderboard">
        <Trophy size={16} />
      </Link>
      <Link to="/replays" className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium">
        <Play size={16} />
        View Replay
      </Link>
    </div>
  );

  return (
    <SectionWrapper 
      title="Live Benchmark Command Center" 
      description="Real-time execution telemetry and worker state."
      badgeLabel={isLive ? "Live" : "Idle"}
      badgeVariant={isLive ? "success" : "default"}
      actions={actions}
      className="mb-8 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Status Area */}
        <div className="lg:col-span-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30 p-5 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-4 right-4 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </div>
          
          <h3 className="text-cyan-700 dark:text-cyan-400 font-bold uppercase tracking-widest text-xs mb-2">Current Stage</h3>
          <p className="text-2xl font-black text-foreground mb-4">{liveStats.stage}</p>
          
          <div className="w-full bg-cyan-200/50 dark:bg-cyan-900/50 rounded-full h-2 mb-2">
            <motion.div 
              className="bg-cyan-500 h-2 rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: '40%' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs text-muted-foreground">40% Complete</span>
        </div>

        {/* Metrics Grid */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricCard icon={<Activity size={18} />} label="Current TPS" value={liveStats.tps} color="cyan" />
          <MetricCard icon={<Clock size={18} />} label="Current P99" value={liveStats.p99} color="amber" />
          <MetricCard icon={<ShieldCheck size={18} />} label="Success %" value={liveStats.success} color="emerald" />
          
          <MetricCard icon={<Server size={18} />} label="Worker Utilization" value={liveStats.workerUtilization} color="indigo" />
          <MetricCard icon={<List size={18} />} label="Queue Depth" value={liveStats.queueDepth} color="purple" />
          <MetricCard icon={<Users size={18} />} label="Persona Mix" value={liveStats.personaMix} color="blue" />
        </div>
      </div>
    </SectionWrapper>
  );
}

// Temporary icon imports specifically for this component block
import { Clock, ShieldCheck } from 'lucide-react';

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  };

  return (
    <div className="flex flex-col p-4 rounded-xl border border-border bg-background shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-md ${colorMap[color]}`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
