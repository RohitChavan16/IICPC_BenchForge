import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';

interface LiveLogsProps {
  submissionId: string;
  isActive?: boolean;
}

interface LogMessage {
  timestamp: string;
  stage: string;
  type: string;
  message: string;
  stage_status: string;
}

export function LiveLogs({ submissionId, isActive = true }: LiveLogsProps) {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(isActive);

  // Auto-collapse when inactive, but don't auto-expand if user manually collapsed
  useEffect(() => {
    if (!isActive) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  }, [isActive]);

  useEffect(() => {
    if (!submissionId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Using port 8080 because the API Gateway maps to 8080 and proxies WS correctly,
    // or direct to submission-service (8082). We'll assume the API gateway handles it or direct mapping.
    // Given the architecture, API Gateway on 8080 is the default.
    const wsUrl = `${protocol}//${window.location.hostname}:8080/api/v1/submissions/${submissionId}/logs`;
    
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLogs(prev => [...prev, data]);
      } catch (e) {
        console.error('Failed to parse log message:', e);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => {
      ws.close();
    };
  }, [submissionId]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="bg-[#0f172a] rounded-lg border border-slate-800 overflow-hidden mt-6">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Live Execution Logs</span>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
        >
          {isExpanded ? 'Hide Logs' : 'View Logs'}
        </button>
      </div>
      {isExpanded && (
        <div className="p-4 h-64 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic">Waiting for logs...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="mb-1">
                <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                <span className="text-indigo-400">[{log.stage}]</span>{' '}
                <span className={log.stage_status === 'FAILED' ? 'text-rose-400' : log.stage_status === 'SUCCESS' ? 'text-emerald-400' : 'text-slate-300'}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}
