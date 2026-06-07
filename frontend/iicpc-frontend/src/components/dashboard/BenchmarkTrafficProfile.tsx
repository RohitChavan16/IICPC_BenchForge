import React from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, Zap, Shield, Skull } from 'lucide-react';

const personas = [
  { name: 'Retail Trader', id: 'retail', pct: 60, color: 'bg-blue-500', icon: Users, desc: 'Standard medium flow' },
  { name: 'Market Maker', id: 'market_maker', pct: 20, color: 'bg-emerald-500', icon: Shield, desc: 'Tight spread quotes' },
  { name: 'Scalper', id: 'scalper', pct: 10, color: 'bg-purple-500', icon: Activity, desc: 'High-frequency micro trades' },
  { name: 'Whale', id: 'whale', pct: 5, color: 'bg-amber-500', icon: Zap, desc: 'Massive sweeping orders' },
  { name: 'HFT / Latency Stressor', id: 'hft_stressor', pct: 5, color: 'bg-rose-500', icon: Skull, desc: 'Extreme random pricing' },
];

export const BenchmarkTrafficProfile: React.FC<{ totalRequests?: number }> = ({ totalRequests }) => {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 backdrop-blur-sm shadow-xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Benchmark Traffic Profile</h3>
          <p className="text-gray-400 text-sm">Deterministic execution sequence guaranteeing identical market conditions.</p>
        </div>
        <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-500/30 whitespace-nowrap ml-4">
          v1.0 - Hackathon Mix
        </div>
      </div>

      <div className="space-y-4">
        {personas.map((p, i) => {
          const Icon = p.icon;
          const count = totalRequests ? Math.round((totalRequests * p.pct) / 100) : null;
          return (
            <div key={p.id} className="relative group">
              <div className="flex justify-between text-sm mb-1">
                <div className="flex items-center text-gray-200">
                  <Icon className={`w-4 h-4 mr-2 ${p.color.replace('bg-', 'text-')}`} />
                  <span className="font-medium group-hover:text-white transition-colors">{p.name}</span>
                  <span className="text-gray-500 ml-2 hidden sm:inline">- {p.desc}</span>
                </div>
                <div className="text-gray-300 font-mono">
                  {count && <span className="mr-3 text-gray-500">{count} reqs</span>}
                  {p.pct}%
                </div>
              </div>
              <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden shadow-inner border border-gray-700/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.pct}%` }}
                  transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                  className={`h-full ${p.color} rounded-full`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
