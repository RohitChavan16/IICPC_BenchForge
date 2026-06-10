import { motion } from 'framer-motion';
import { Calculator, Zap, Clock, ShieldCheck, Activity } from 'lucide-react';

export function ScoringExplanationCenter() {
  const formulas = [
    { title: 'Base Calculation', icon: Calculator, color: 'text-amber-500', desc: 'TPS is heavily weighted, with logarithmic scaling applied to latency (P99) penalties.' },
    { title: 'TPS Impact', icon: Zap, color: 'text-cyan-500', desc: 'Linear multiplier. Higher throughput directly correlates to a higher potential base score.' },
    { title: 'Latency Penalty', icon: Clock, color: 'text-indigo-500', desc: 'Exponential penalty for P99 latency exceeding acceptable thresholds (> 500ms).' },
    { title: 'Correctness Multiplier', icon: ShieldCheck, color: 'text-emerald-500', desc: 'Strict scaling. A success rate of 99.5% receives a 1.0x multiplier, while < 90% drops to 0.1x.' },
    { title: 'Concurrency Bonus', icon: Activity, color: 'text-purple-500', desc: 'Systems capable of sustaining high TPS across maximum connections receive a +10% stability bonus.' },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Scoring Explanation Center</h2>
        <p className="text-sm text-muted-foreground">Administrative reference for the live benchmark evaluation algorithm.</p>
      </div>

      <div className="rounded-[24px] border border-amber-500/20 bg-background p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {formulas.map((item, idx) => (
            <div key={idx} className="flex flex-col border-b border-border pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-4 last:border-0 last:pr-0">
              <div className="flex items-center gap-2 mb-3">
                <item.icon size={16} className={item.color} />
                <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">{item.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
