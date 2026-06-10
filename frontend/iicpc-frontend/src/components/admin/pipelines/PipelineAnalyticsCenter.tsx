import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function PipelineAnalyticsCenter() {
  const throughputData = [
    { time: '00:00', upload: 40, validate: 38, bench: 35 },
    { time: '04:00', upload: 30, validate: 29, bench: 28 },
    { time: '08:00', upload: 60, validate: 55, bench: 50 },
    { time: '12:00', upload: 120, validate: 110, bench: 90 },
    { time: '16:00', upload: 180, validate: 165, bench: 140 },
    { time: '20:00', upload: 90, validate: 85, bench: 80 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-background/95 p-3 shadow-xl backdrop-blur-md">
          <p className="mb-2 text-xs font-bold text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs mb-1">
              <span style={{ color: entry.color }} className="font-semibold">{entry.name}</span>
              <span className="font-mono text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Pipeline Analytics Center</h2>
        <p className="text-sm text-muted-foreground">Historical volume and throughput trends across critical execution stages.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/5 to-background p-6">
          <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-cyan-500">Pipeline Throughput</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBench" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#06b6d4" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="upload" name="Uploads" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUpload)" />
                <Area type="monotone" dataKey="bench" name="Benchmarks" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorBench)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/5 to-background p-6">
          <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-indigo-500">Stage Duration Trends</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={throughputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#6366f1" strokeOpacity={0.1} vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#6366f1', opacity: 0.1 }} />
                <Bar dataKey="validate" name="Validation (s)" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </motion.section>
  );
}
