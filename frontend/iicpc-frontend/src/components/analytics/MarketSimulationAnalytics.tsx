import React, { useEffect, useState } from 'react';
import { fetchPersonaAnalytics } from '@/services/api/telemetryService';
import type { PersonaData } from '@/types/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity } from 'lucide-react';

interface Props {
  benchmarkId: string;
}

const personaColors: Record<string, string> = {
  retail: '#3b82f6',        // blue-500
  market_maker: '#10b981',  // emerald-500
  scalper: '#a855f7',       // purple-500
  whale: '#f59e0b',         // amber-500
  hft_stressor: '#f43f5e',  // rose-500
};

const personaLabels: Record<string, string> = {
  retail: 'Retail Trader',
  market_maker: 'Market Maker',
  scalper: 'Scalper',
  whale: 'Whale',
  hft_stressor: 'HFT Stressor',
};

export const MarketSimulationAnalytics: React.FC<Props> = ({ benchmarkId }) => {
  const [data, setData] = useState<PersonaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const stats = await fetchPersonaAnalytics(benchmarkId);
        // Exclude system/tracer bots if they leak into here
        const filtered = stats.filter(s => personaColors[s.botType]);
        setData(filtered);
      } catch (err) {
        console.error("Failed to load persona analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    if (benchmarkId) {
      loadData();
    }
  }, [benchmarkId]);

  if (loading) {
    return <div className="animate-pulse bg-gray-800 rounded-xl h-64 border border-gray-700"></div>;
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 backdrop-blur-sm text-center">
        <Activity className="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <p className="text-gray-400">No market simulation analytics available.</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    name: personaLabels[d.botType] || d.botType,
    botType: d.botType,
    Requests: d.total,
    Latency: Math.round(d.latency / 1000000), // convert to ms
    SuccessRate: Math.round(d.successRate * 10) / 10,
    TPS: Math.round(d.tps * 10) / 10,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 backdrop-blur-sm shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4">Requests by Persona</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="Requests" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={personaColors[entry.botType]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 backdrop-blur-sm shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">P99 Latency by Persona (ms)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                />
                <Bar dataKey="Latency" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={personaColors[entry.botType]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 backdrop-blur-sm shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">TPS by Persona</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                />
                <Bar dataKey="TPS" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={personaColors[entry.botType]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 backdrop-blur-sm shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">Success Rate (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#9ca3af" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                />
                <Bar dataKey="SuccessRate" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={personaColors[entry.botType]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
