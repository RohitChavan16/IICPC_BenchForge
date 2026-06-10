import React, { useState, useEffect, useRef } from 'react';
import type { ReplayData, ReplaySnapshot, ReplayInsight } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Play, Pause, FastForward } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';

interface ReplayContainerProps {
  replay: ReplayData;
}

export function ReplayContainer({ replay }: ReplayContainerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  const maxIndex = replay.snapshots.length - 1;
  const currentSnapshot = replay.snapshots[currentIndex];
  
  // Handle playback interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && currentIndex < maxIndex && replay.status === 'READY') {
      interval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= maxIndex) {
            setIsPlaying(false);
            return maxIndex;
          }
          return prev + 1;
        });
      }, speed === 1 ? 500 : 250);
    } else if (currentIndex >= maxIndex) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, currentIndex, maxIndex, replay.status]);

  if (replay.status === 'PENDING' || replay.status === 'PROCESSING') {
    return (
      <Card className="w-full h-64 flex items-center justify-center animate-pulse bg-card border-border">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-muted rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Finalizing Telemetry & Generating Replay...</h3>
        </div>
      </Card>
    );
  }

  if (replay.status === 'FAILED' && !replay.snapshots?.length) {
    return (
      <Card className="w-full bg-card border-border">
        <CardContent className="p-6 text-center text-muted-foreground">
          Replay visualization could not be generated for this run.
        </CardContent>
      </Card>
    );
  }

  if (!replay.snapshots?.length) {
    return null;
  }

  // Find insights for current index
  const activeInsights = replay.insights.filter(i => i.bucket_index === currentIndex);

  // Prepare chart data (slice up to current index)
  const chartData = replay.snapshots.slice(0, currentIndex + 1).map(s => {
    const data: any = { 
      progress: s.progress_percent,
      tps: s.tps,
      p99: s.p99 / 1000000,
      successRate: s.success_rate
    };
    for (const [persona, count] of Object.entries(s.persona_distribution)) {
      data[persona] = count;
    }
    return data;
  });

  // Replay Summary Metrics
  const peakTps = Math.max(...replay.snapshots.map(s => s.tps));
  const worstP99 = Math.max(...replay.snapshots.map(s => s.p99)) / 1000000;
  const avgSuccessRate = replay.snapshots.reduce((acc, s) => acc + s.success_rate, 0) / replay.snapshots.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard title="Peak TPS" value={peakTps.toLocaleString()} variant="blue" />
        <MetricCard title="Worst P99" value={`${worstP99.toFixed(1)} ms`} variant="rose" />
        <MetricCard title="Avg Success" value={`${avgSuccessRate.toFixed(1)}%`} variant="emerald" />
        <MetricCard title="Progress" value={`${currentSnapshot.progress_percent}%`} variant="violet" />
        <MetricCard title="Duration" value={`${(replay.snapshots.length * 5)}% Timeline`} variant="amber" />
      </div>

      {activeInsights.length > 0 && (
        <div className="bg-blue-900/50 border border-blue-500/50 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-4">
          {activeInsights.map((insight, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <Badge variant="info" className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                {insight.type.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-blue-100">{insight.message}</span>
            </div>
          ))}
        </div>
      )}

      {replay.status === 'FAILED' && currentIndex === maxIndex && replay.failure_reason && (
        <div className="bg-red-900/80 border-l-4 border-red-500 p-6 rounded-r-lg shadow-lg">
          <h3 className="text-red-100 font-bold text-lg mb-2">🚨 FATAL BENCHMARK FAILURE</h3>
          <p className="text-red-200">{replay.failure_reason}</p>
        </div>
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Persona Traffic Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRetail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWhale" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="progress" stroke="currentColor" opacity={0.5} tickFormatter={(v) => `${v}%`} domain={[0, 100]} type="number" />
                <YAxis stroke="currentColor" opacity={0.5} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="retail" name="Retail Trader" stackId="1" stroke="#3b82f6" fill="url(#colorRetail)" isAnimationActive={false} />
                <Area type="monotone" dataKey="whale" stackId="1" stroke="#ec4899" fill="url(#colorWhale)" isAnimationActive={false} />
                <Area type="monotone" dataKey="market_maker" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.5} isAnimationActive={false} />
                <Area type="monotone" dataKey="scalper" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} isAnimationActive={false} />
                <Area type="monotone" dataKey="hft_stressor" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">System Response Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="progress" stroke="currentColor" opacity={0.5} tickFormatter={(v) => `${v}%`} domain={[0, 100]} type="number" />
                <YAxis yAxisId="left" stroke="currentColor" opacity={0.5} />
                <YAxis yAxisId="right" orientation="right" stroke="currentColor" opacity={0.5} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="tps" name="TPS" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="p99" name="P99 Latency (ms)" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="successRate" name="Success Rate (%)" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border p-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
          </button>
          
          <button 
            onClick={() => setSpeed(speed === 1 ? 2 : 1)}
            className="px-3 py-1 rounded bg-secondary/20 hover:bg-secondary/40 text-muted-foreground text-sm font-medium transition-colors flex items-center border border-border"
          >
            <FastForward size={14} className="mr-1" />
            {speed}x
          </button>

          <div className="flex-1 relative">
            <div className="absolute w-full h-2 bg-secondary/50 rounded-full top-1/2 -translate-y-1/2 border border-border/50" />
            {/* Timeline markers for insights */}
            {replay.insights.map((insight, idx) => {
               const percentage = replay.snapshots[insight.bucket_index]?.progress_percent || 0;
               return (
                 <div 
                   key={idx}
                   className="absolute w-3 h-3 bg-yellow-500 rounded-full top-1/2 -translate-y-1/2 z-10 -ml-1.5 cursor-help group shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                   style={{ left: `${percentage}%` }}
                 >
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-card border border-border text-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                     <div className="font-bold text-yellow-500 mb-1">{percentage}% - {insight.type.replace('_', ' ')}</div>
                     <div className="text-muted-foreground">{insight.message}</div>
                   </div>
                 </div>
               );
            })}
            <input 
              type="range" 
              min={0} 
              max={19} 
              value={currentIndex}
              onChange={(e) => {
                let val = parseInt(e.target.value, 10);
                if (val > maxIndex) val = maxIndex;
                setCurrentIndex(val);
                setIsPlaying(false);
              }}
              className="w-full relative z-20 opacity-0 cursor-pointer h-8"
            />
            {/* Scrubber Knob & Fill */}
            <div 
              className="absolute h-2 bg-blue-500 rounded-full top-1/2 -translate-y-1/2 pointer-events-none" 
              style={{ width: `${(currentIndex / 19) * 100}%` }}
            />
            {/* Visual indicator of true failure point (if failed) */}
            {replay.status === 'FAILED' && (
              <div 
                className="absolute w-1 h-3 bg-red-500/50 top-1/2 -translate-y-1/2 pointer-events-none" 
                style={{ left: `${(maxIndex / 19) * 100}%` }}
              />
            )}
            <div 
              className={`absolute w-4 h-4 rounded-full top-1/2 -translate-y-1/2 -ml-2 shadow-lg pointer-events-none transition-colors ${replay.status === 'FAILED' && currentIndex === maxIndex ? 'bg-red-500 scale-125' : 'bg-white'}`}
              style={{ left: `${(currentIndex / 19) * 100}%` }}
            />
          </div>
          <div className="text-muted-foreground text-sm font-medium w-12 text-right">
            {currentSnapshot.progress_percent}%
          </div>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, variant = 'blue' }: { title: string, value: string | number, variant?: 'blue' | 'rose' | 'emerald' | 'violet' | 'amber' }) {
  const styles = {
    blue: { bg: 'bg-blue-500/10 border-blue-500/20', label: 'text-blue-600 dark:text-blue-400', value: 'text-blue-700 dark:text-blue-300' },
    rose: { bg: 'bg-rose-500/10 border-rose-500/20', label: 'text-rose-600 dark:text-rose-400', value: 'text-rose-700 dark:text-rose-300' },
    emerald: { bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'text-emerald-600 dark:text-emerald-400', value: 'text-emerald-700 dark:text-emerald-300' },
    violet: { bg: 'bg-violet-500/10 border-violet-500/20', label: 'text-violet-600 dark:text-violet-400', value: 'text-violet-700 dark:text-violet-300' },
    amber: { bg: 'bg-amber-500/10 border-amber-500/20', label: 'text-amber-600 dark:text-amber-400', value: 'text-amber-700 dark:text-amber-300' },
  }

  const s = styles[variant]

  return (
    <div className={`${s.bg} border rounded-xl px-4 py-2.5 flex flex-col justify-center`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wider mb-0.5 opacity-80 ${s.label}`}>{title}</p>
      <p className={`text-lg font-bold leading-tight ${s.value}`}>{value}</p>
    </div>
  );
}
