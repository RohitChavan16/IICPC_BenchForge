import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionWrapper } from './SectionWrapper';
import { Play, FileText, Activity, Trophy, Server, Users, List, ShieldAlert, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSharedWebsocketClient } from '@/services/websocket/websocketClient';
import type { WebSocketStatus } from '@/services/websocket/websocketClient';
import type { MetricSnapshot, PersonaMetricMap, TracerStats, LiveRequest, WorkerMetricMap, BenchmarkSession } from '@/types/api';

export function DashboardLiveCommandCenter() {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [snapshot, setSnapshot] = useState<MetricSnapshot | null>(null);
  const [personas, setPersonas] = useState<PersonaMetricMap>({});
  const [workers, setWorkers] = useState<WorkerMetricMap>({});
  const [activeSession, setActiveSession] = useState<BenchmarkSession | null>(null);
  const [tracerStats, setTracerStats] = useState<TracerStats>({ executed: 0, passed: 0, failed: 0 });
  const [recentRequests, setRecentRequests] = useState<LiveRequest[]>([]);

  useEffect(() => {
    const ws = getSharedWebsocketClient(import.meta.env.VITE_WS_URL || 'ws://localhost:8081/ws');
    
    setStatus(ws.getStatus());
    setSnapshot(ws.getLatestSnapshot());
    setPersonas(ws.getLatestPersonas());
    setWorkers(ws.getLatestWorkers());
    setTracerStats(ws.getLatestTracerStats());
    setRecentRequests(ws.getLatestRequests());

    const handleStatus = (s: WebSocketStatus) => setStatus(s);
    const handleSnapshot = (data: MetricSnapshot) => setSnapshot(data);
    const handlePersonas = (data: PersonaMetricMap) => setPersonas(data);
    const handleWorkers = (data: WorkerMetricMap) => setWorkers(data);
    const handleTracer = (data: TracerStats) => setTracerStats(data);
    const handleRequests = (data: LiveRequest[]) => {
      setRecentRequests((prev) => {
        // Keep newest first, max 50 items
        const combined = [...data, ...prev];
        return combined.slice(0, 50);
      });
    };

    ws.addStatusHandler(handleStatus);
    ws.addHandler(handleSnapshot);
    ws.addPersonaHandler(handlePersonas);
    ws.addWorkerHandler(handleWorkers);
    ws.addTracerHandler(handleTracer);
    ws.addRequestHandler(handleRequests);
    ws.connect();

    const fetchSession = () => {
      import('@/services/api/benchmarkService').then(({ fetchBenchmarkSessions }) => {
        fetchBenchmarkSessions().then(res => {
           const running = res.items.find(s => s.status === 'Running') || res.items[0];
           if (running) setActiveSession(running);
        }).catch(console.error);
      });
    };
    
    fetchSession();
    const interval = setInterval(fetchSession, 5000);

    return () => {
      ws.removeStatusHandler(handleStatus);
      ws.removeHandler(handleSnapshot);
      ws.removePersonaHandler(handlePersonas);
      ws.removeWorkerHandler(handleWorkers);
      ws.removeTracerHandler(handleTracer);
      ws.removeRequestHandler(handleRequests);
      clearInterval(interval);
    };
  }, []);

  const isLive = status === 'connected';
  
  const formatPersonaMix = (map: PersonaMetricMap) => {
    const keys = Object.keys(map);
    if (keys.length === 0) return '-';
    return keys.map(k => `${k}: ${Math.floor(map[k].tps)} TPS`).join(', ');
  };

  const activeWorkerCount = Object.keys(workers).length;
  const totalWorkers = activeSession ? activeSession.workerCount : 0;
  const totalExpected = activeSession ? activeSession.totalRequests : 0;
  const currentTotal = snapshot ? snapshot.total : 0;
  
  let progressPercent = 0;
  if (activeSession) {
    if (activeSession.status === 'Completed') {
      progressPercent = 100;
    } else if (activeSession.status === 'Failed' || activeSession.status === 'Running') {
      const baseTotal = activeSession.status === 'Failed' ? (activeSession.successCount + activeSession.failureCount) : currentTotal;
      progressPercent = totalExpected > 0 ? Math.min(100, Math.floor((baseTotal / totalExpected) * 100)) : 0;
    }
  }

  const workerUtilization = totalWorkers > 0 ? `${activeWorkerCount}/${totalWorkers} Active` : (activeWorkerCount > 0 ? `${activeWorkerCount} Active` : '-');

  const tracerSuccessRate = tracerStats.executed > 0 ? ((tracerStats.passed / tracerStats.executed) * 100).toFixed(1) + '%' : '-';

  const liveStats = {
    stage: activeSession ? activeSession.status : '-',
    tps: snapshot ? Math.floor(snapshot.tps).toLocaleString() : '-',
    p99: snapshot ? `${Math.floor(snapshot.p99)}ms` : '-',
    success: snapshot ? `${((1 - snapshot.failureRate) * 100).toFixed(1)}%` : '-',
    workerUtilization: activeWorkerCount > 0 ? `${activeWorkerCount} Active` : '-',
    queueDepth: snapshot && typeof snapshot.queueDepth === 'number' ? snapshot.queueDepth.toLocaleString() : '-',
    personaMix: formatPersonaMix(personas),
    tracerStats: `${tracerStats.passed} Passed / ${tracerStats.executed} Executed`
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
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progressPercent}% Complete</span>
        </div>

        {/* Metrics Grid */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={<Activity size={18} />} label="Current TPS" value={liveStats.tps} color="cyan" />
          <MetricCard icon={<Clock size={18} />} label="Current P99" value={liveStats.p99} color="amber" />
          <MetricCard icon={<ShieldCheck size={18} />} label="Success %" value={liveStats.success} color="emerald" />
          <MetricCard icon={<Server size={18} />} label="Worker Utilization" value={liveStats.workerUtilization} color="indigo" />
          
          <MetricCard 
            icon={<List size={18} />} 
            label="Queue Depth" 
            value={liveStats.queueDepth} 
            color="purple" 
            subValue="Total backlog (Lag + Pending)"
          />
          <MetricCard icon={<Users size={18} />} label="Persona Mix" value={liveStats.personaMix} color="blue" />
          <MetricCard icon={<ShieldAlert size={18} />} label="Tracer Success" value={tracerSuccessRate} color="rose" subValue={liveStats.tracerStats} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Worker Performance Panel */}
        <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden flex flex-col h-72">
          <div className="flex items-center gap-2 p-4 border-b border-border bg-slate-50 dark:bg-slate-900/50">
            <Cpu size={16} className="text-indigo-500" />
            <h4 className="text-sm font-semibold">Worker Performance</h4>
          </div>
          <div className="overflow-y-auto p-0 flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Worker ID</th>
                  <th className="p-3 font-medium">TPS</th>
                  <th className="p-3 font-medium">P99</th>
                  <th className="p-3 font-medium">Success</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(workers).map((w, i) => (
                  <tr key={w.workerId} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="p-3 font-mono text-xs">{w.workerId}</td>
                    <td className="p-3">{Math.floor(w.tps)}</td>
                    <td className="p-3 text-amber-500">{Math.floor(w.p99)}ms</td>
                    <td className="p-3 text-emerald-500">{((1 - w.failureRate) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                {Object.keys(workers).length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground text-xs italic">No active workers</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Requests Stream */}
        <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden flex flex-col h-72">
          <div className="flex items-center gap-2 p-4 border-b border-border bg-slate-50 dark:bg-slate-900/50">
            <List size={16} className="text-cyan-500" />
            <h4 className="text-sm font-semibold">Live Requests Stream</h4>
            {status === 'disconnected' && <span className="ml-auto text-xs text-rose-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /> Disconnected</span>}
          </div>
          <div className="overflow-y-auto p-3 flex-1 font-mono text-xs">
            <AnimatePresence>
              {recentRequests.map((req, i) => (
                <motion.div
                  key={`${req.requestId}-${i}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0"
                >
                  <span className="text-muted-foreground w-16 truncate" title={req.requestId}>{req.requestId.split('-')[0]}</span>
                  <span className={`w-16 truncate ${req.botType === 'tracer' ? 'text-rose-400 font-bold' : 'text-blue-400'}`}>{req.botType}</span>
                  <span className={`w-16 ${req.success ? 'text-emerald-500' : 'text-rose-500'}`}>{req.success ? 'PASS' : 'FAIL'}</span>
                  <span className="text-amber-500">{req.latency}ms</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {recentRequests.length === 0 && (
              <div className="text-muted-foreground italic mt-2 text-center">Waiting for requests...</div>
            )}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

// Temporary icon imports specifically for this component block
import { Clock, ShieldCheck } from 'lucide-react';

function MetricCard({ icon, label, value, color, subValue }: { icon: React.ReactNode, label: string, value: string, color: string, subValue?: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
  };

  return (
    <div className="flex flex-col p-4 rounded-xl border border-border bg-background shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-md ${colorMap[color] || colorMap.cyan}`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
      {subValue && <div className="text-[10px] text-muted-foreground mt-1">{subValue}</div>}
    </div>
  );
}
