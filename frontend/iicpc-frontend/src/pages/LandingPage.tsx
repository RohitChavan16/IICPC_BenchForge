import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowRight, Activity, Cpu, Database, Sparkles, ShieldCheck, Box, Zap, BarChart, Server, Layers } from 'lucide-react'

const features = [
  { label: 'Live Observability', icon: Activity, desc: 'Real-time metrics from distributed test runners.' },
  { label: 'Containerized Sandboxing', icon: Box, desc: 'Strictly isolated runtime for secure code execution.' },
  { label: 'Distributed Load Gen', icon: Zap, desc: 'Massive parallel traffic simulation.' },
  { label: 'High-Fidelity Telemetry', icon: Database, desc: 'Sub-millisecond tracking with PostgreSQL & Redis.' }
]

const workflowSteps = [
  { step: '01', title: 'Upload Code', icon: Cpu, desc: 'Submit trading infrastructure binaries or source code.' },
  { step: '02', title: 'Container Build', icon: Box, desc: 'Securely build and sandbox the submission.' },
  { step: '03', title: 'Deployment', icon: Server, desc: 'Deploy across strictly isolated worker fleets.' },
  { step: '04', title: 'Load Testing', icon: Zap, desc: 'Spawns thousands of bots simulating market participants.' },
  { step: '05', title: 'Telemetry', icon: Activity, desc: 'Ingest and validate latency and correctness.' },
  { step: '06', title: 'Leaderboard', icon: BarChart, desc: 'Rank participants on live streaming metrics.' }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
}

export function LandingPage() {
  return (
    <div className="relative w-full overflow-hidden pb-20 pt-10 sm:pb-32 sm:pt-20">
      {/* Animated Background Gradients */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="absolute top-[-10%] h-[600px] w-[800px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-violet-500/20 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* HERO SECTION */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div variants={itemVariants} className="mb-6 flex justify-center">
            <Badge variant="info" className="border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm backdrop-blur-md">
              <Sparkles className="mr-2 inline h-4 w-4" /> IICPC Summer Hackathon 2026
            </Badge>
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
            Distributed Benchmarking <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Built for Scale.
            </span>
          </motion.h1>
          <motion.p variants={itemVariants} className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            A high-performance hosting platform to upload trading infrastructure, simulate immense market traffic, and compete on a live global leaderboard.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 font-semibold shadow-glow">
              <Link to="/register">Deploy Your Submission</Link>
            </Button>
            <Button variant="secondary" asChild size="lg" className="rounded-full bg-white/5 px-8 font-semibold backdrop-blur-md hover:bg-white/10">
              <Link to="/leaderboard">View Leaderboard</Link>
            </Button>
          </motion.div>
        </motion.section>

        {/* WORKFLOW VISUALIZATION */}
        <section className="mt-32">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">The Benchmark Engine</h2>
            <p className="mt-4 text-slate-400">A completely automated pipeline from code to scoring.</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workflowSteps.map((step, idx) => (
              <motion.div 
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/50 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:bg-slate-900/80 hover:shadow-[0_0_40px_-15px_rgba(6,182,212,0.3)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-cyan-400 transition-colors group-hover:bg-cyan-500/20 group-hover:text-cyan-300">
                    <step.icon size={28} />
                  </div>
                  <span className="text-4xl font-black text-white/5 transition-colors group-hover:text-white/10">{step.step}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="mt-32">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Engineered for absolute correctness and speed.</h2>
              <p className="mt-6 text-lg text-slate-400">
                BenchForge handles the complexity of isolated container orchestration and distributed load generation so you can focus on building the fastest trading systems.
              </p>
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {features.map((feature, idx) => (
                  <motion.div 
                    key={feature.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="space-y-3"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                      <feature.icon size={20} />
                    </div>
                    <h4 className="font-semibold text-white">{feature.label}</h4>
                    <p className="text-sm text-slate-400">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5" />
              <div className="relative">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="text-cyan-400" size={20} />
                    <span className="font-semibold text-white">Live Telemetry</span>
                  </div>
                  <Badge variant="success">Recording</Badge>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-400">Peak TPS</p>
                    <p className="mt-2 text-3xl font-bold text-cyan-400">14,205</p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-400">p99 Latency</p>
                    <p className="mt-2 text-3xl font-bold text-violet-400">1.2 ms</p>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-400">System Correctness</p>
                    <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full w-[99.9%] bg-emerald-400" />
                    </div>
                    <p className="mt-2 text-right text-xs text-emerald-400">99.9% Valid Fills</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA FOOTER */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 overflow-hidden rounded-[3rem] border border-white/10 bg-slate-900/60 p-12 text-center backdrop-blur-xl"
        >
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to test your limits?</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Join the leaderboard and prove your trading infrastructure can handle the most intense distributed load generation.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="rounded-full px-8 text-lg font-semibold shadow-glow">
              <Link to="/register">Create a Team</Link>
            </Button>
          </div>
        </motion.section>

      </div>
    </div>
  )
}
