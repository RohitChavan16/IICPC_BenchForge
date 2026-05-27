import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ArrowRight, Activity, Cpu, Database, Sparkles, ShieldCheck } from 'lucide-react'

const featureCards = [
  { label: 'Live system observability', icon: Activity },
  { label: 'Distributed benchmark orchestration', icon: Sparkles },
  { label: 'Redis and PostgreSQL telemetry', icon: Database },
  { label: 'Secure role-aware control plane', icon: ShieldCheck },
]

export function LandingPage() {
  return (
    <div className="pb-16 pt-10 sm:pb-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:px-8 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-8">
          <Badge>Enterprise benchmark control</Badge>
          <div className="space-y-6">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              IICPC BenchForge — launch real-time distributed benchmark observability.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-400">
              Designed for SRE teams, backend engineers, and infrastructure operators who need a premium telemetry platform for high-frequency systems.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {featureCards.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-[32px] border border-white/10 bg-slate-900/70 p-5 shadow-glow backdrop-blur-xl">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-300">
                    <Icon size={20} />
                  </div>
                  <p className="mt-4 text-base font-semibold text-white">{item.label}</p>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link to="/register">Start a demo</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/login">Login to workspace</Link>
            </Button>
          </div>
        </section>

        <section className="space-y-6 rounded-[40px] border border-white/10 bg-slate-900/70 p-8 shadow-glow backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Platform metrics</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Telemetry health at a glance</h2>
            </div>
            <div className="rounded-3xl bg-slate-950/60 px-4 py-2 text-sm text-slate-300">Live data hub</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-slate-950/80 shadow-none" title="TPS peak" description="Sustained throughput across worker fleets.">
              <div className="text-5xl font-semibold text-cyan-300">1.58k</div>
            </Card>
            <Card className="bg-slate-950/80 shadow-none" title="99th latency" description="Transaction latency under load.">
              <div className="text-5xl font-semibold text-violet-300">180 ms</div>
            </Card>
            <Card className="bg-slate-950/80 shadow-none" title="Worker uptime" description="Active benchmark workers online.">
              <div className="text-5xl font-semibold text-emerald-300">98.7%</div>
            </Card>
            <Card className="bg-slate-950/80 shadow-none" title="Data freshness" description="WebSocket telemetry refresh rate.">
              <div className="text-5xl font-semibold text-slate-50">1s</div>
            </Card>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Architecture highlight</p>
                <p className="mt-2 text-xl font-semibold text-white">Cloud-native benchmark pipeline</p>
              </div>
              <div className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">Redis Streams</div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Telemetry</p>
                <p className="mt-2 text-lg font-semibold text-white">Realtime aggregations</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Persistence</p>
                <p className="mt-2 text-lg font-semibold text-white">PostgreSQL metrics store</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-[32px] border border-white/10 bg-slate-950/80 p-6">
            <div>
              <p className="text-sm text-slate-400">Benchmark workflow</p>
              <p className="mt-2 text-lg font-semibold text-white">Simulate traffic, stream telemetry, analyze behavior.</p>
            </div>
            <ArrowRight className="text-cyan-300" size={28} />
          </div>
        </section>
      </div>
    </div>
  )
}
