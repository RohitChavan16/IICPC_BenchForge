import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendDataPoint {
  timestamp: string;
  avgScore: number;
  avgTps: number;
  avgLatency: number;
  successRate: number;
}

interface PerformanceTrendsProps {
  historyData?: TrendDataPoint[];
}

export function PerformanceTrends({ historyData }: PerformanceTrendsProps) {
  // Hide gracefully if historical data is unavailable
  if (!historyData || historyData.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-violet-500/20 bg-background/95 p-3 shadow-xl backdrop-blur-sm">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="text-sm font-bold text-violet-400">{payload[0].name}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Performance Trends</h2>
        <p className="text-sm text-muted-foreground">Historical evolution of average fleet performance metrics.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Average Score Trend */}
        <div className="rounded-[24px] border border-violet-500/20 bg-gradient-to-br from-violet-950/5 to-background p-6">
          <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-violet-500">Average Score Trend</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#8b5cf6" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Area type="monotone" dataKey="avgScore" name="Avg Score" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average TPS Trend */}
        <div className="rounded-[24px] border border-violet-500/20 bg-gradient-to-br from-violet-950/5 to-background p-6">
          <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-violet-500">Average TPS Trend</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#8b5cf6" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Area type="monotone" dataKey="avgTps" name="Avg TPS" stroke="#a78bfa" fillOpacity={1} fill="url(#colorTps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
