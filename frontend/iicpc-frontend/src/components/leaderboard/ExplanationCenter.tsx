import { motion } from 'framer-motion';
import { Info, Target, Zap, Clock, ShieldCheck } from 'lucide-react';

export function ExplanationCenter() {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Leaderboard Explanation Center</h2>
        <p className="text-sm text-muted-foreground">Understanding the core metrics and ranking algorithms.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Final Score */}
        <div className="rounded-[24px] border border-slate-500/20 bg-background p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-500/10 text-slate-400">
              <Target size={20} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Final Score</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>
              The Final Score is a composite metric combining <strong>Throughput (TPS)</strong>, <strong>Latency Penalties</strong>, and <strong>Correctness Multipliers</strong>.
            </p>
            <p>
              An engine with extreme TPS but high error rates will score significantly lower than a well-balanced, accurate engine. Correctness acts as a strict multiplier, meaning errors heavily penalize the final outcome.
            </p>
          </div>
        </div>

        {/* Throughput */}
        <div className="rounded-[24px] border border-slate-500/20 bg-background p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-500/10 text-slate-400">
              <Zap size={20} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Throughput (TPS)</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>
              Transactions Per Second (TPS) measures raw processing capacity. Higher throughput means the engine can clear the order book or process matching instructions faster.
            </p>
            <p>
              While critical, prioritizing TPS at the expense of latency or correctness will result in a suboptimal Final Score.
            </p>
          </div>
        </div>

        {/* Latency */}
        <div className="rounded-[24px] border border-slate-500/20 bg-background p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-500/10 text-slate-400">
              <Clock size={20} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Latency (P99)</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>
              The 99th Percentile (P99) latency indicates that 99% of all requests are processed faster than this time. 
            </p>
            <p>
              In competitive trading scenarios, tail latency (P99) is often more critical than average latency. The ranking algorithm applies exponential penalties as P99 latency increases.
            </p>
          </div>
        </div>

        {/* Correctness */}
        <div className="rounded-[24px] border border-slate-500/20 bg-background p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-500/10 text-slate-400">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Correctness & Success Rate</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>
              Correctness evaluates whether the trading engine matched orders properly, prevented over-drawing, and maintained consistency under high concurrency.
            </p>
            <p>
              Success Rate represents the percentage of valid responses. Engines scoring below 99.0% Success Rate will face severe ranking demotions regardless of throughput.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
