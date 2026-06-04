import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BarChart,
  Box,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  LockKeyhole,
  Moon,
  Network,
  Server,
  Sparkles,
  SunMedium,
  TerminalSquare,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useThemeStore } from '@/stores/useThemeStore'

const features = [
  { label: 'Live Observability', icon: Activity, desc: 'Watch throughput, latency, correctness, queue pressure, and worker health as each run unfolds.' },
  { label: 'Containerized Sandboxing', icon: Box, desc: 'Every submission runs inside strict isolated containers with repeatable build and runtime boundaries.' },
  { label: 'Distributed Load Gen', icon: Zap, desc: 'Generate intense bot traffic across worker fleets to stress-test trading infrastructure under pressure.' },
  { label: 'High-Fidelity Telemetry', icon: Database, desc: 'Capture benchmark events, verdicts, and leaderboard-ready metrics with PostgreSQL and Redis-backed tracking.' },
  { label: 'Infrastructure Signals', icon: Server, desc: 'Surface runner availability, resource pressure, and deployment state before they affect a contest round.' },
  { label: 'Ranking Intelligence', icon: BarChart, desc: 'Turn raw runs into readable scorecards for teams, organizers, reviewers, and mentors.' },
]

const workflowSteps = [
  { step: '01', title: 'Create a team', icon: Users, desc: 'Register, organize contestants, and prepare your trading system for the benchmark track.' },
  { step: '02', title: 'Upload code', icon: TerminalSquare, desc: 'Submit source or binaries through the frontend flow with metadata needed for the run.' },
  { step: '03', title: 'Build safely', icon: Box, desc: 'BenchForge packages the submission into an isolated runtime and records the build output.' },
  { step: '04', title: 'Deploy workers', icon: Network, desc: 'The platform places the container across controlled worker capacity for repeatable execution.' },
  { step: '05', title: 'Stress the system', icon: Zap, desc: 'Market bots push traffic while telemetry captures response time, failures, and correctness.' },
  { step: '06', title: 'Score and rank', icon: Trophy, desc: 'Validated results feed reports and leaderboard standings for fast post-run comparison.' },
]

const stats = [
  { value: '14,205', label: 'Peak simulated TPS' },
  { value: '1.2 ms', label: 'Sample p99 latency' },
  { value: '99.9%', label: 'Correct fills target' },
  { value: '24/7', label: 'Run visibility' },
]

const proofPoints = [
  'No manual spreadsheet scoring after a benchmark round.',
  'One place for submissions, deployments, telemetry, reports, and standings.',
  'Designed for organizers who need repeatable infrastructure contests.',
  'Clear enough for teams to understand what happened after each run.',
]

const scoringSignals = [
  { title: 'Throughput', desc: 'Measures how much validated market activity your system can handle before bottlenecks appear.' },
  { title: 'Latency', desc: 'Highlights tail response times so teams optimize for consistency, not only average speed.' },
  { title: 'Correctness', desc: 'Checks that speed does not come at the cost of invalid fills, broken state, or failed rules.' },
  { title: 'Reliability', desc: 'Tracks runtime stability, container status, and benchmark completion health.' },
]

const faqItems = [
  { q: 'Is this only a landing page?', a: 'No. This page introduces the platform, while login and registration lead into the existing dashboard workflows.' },
  { q: 'Does the landing page call the backend?', a: 'No landing content here depends on network requests, so the page stays readable even when services are offline.' },
  { q: 'Where do teams start?', a: 'Teams can register, submit their trading infrastructure, and then follow benchmark results inside the protected app.' },
]

const proofTones = [
  'border-emerald-200 bg-emerald-50/85 text-emerald-950 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100',
  'border-sky-200 bg-sky-50/85 text-sky-950 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-100',
  'border-orange-200 bg-orange-50/85 text-orange-950 dark:border-orange-300/20 dark:bg-orange-400/10 dark:text-orange-100',
  'border-violet-200 bg-violet-50/85 text-violet-950 dark:border-violet-300/20 dark:bg-violet-400/10 dark:text-violet-100',
]

const statTones = [
  'border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-300/20 dark:bg-teal-400/10 dark:text-teal-100',
  'border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-300/20 dark:bg-indigo-400/10 dark:text-indigo-100',
  'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100',
  'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100',
]

const workflowTones = [
  { card: 'border-orange-200 bg-orange-50/80 dark:border-orange-300/20 dark:bg-orange-400/10', icon: 'bg-orange-100 text-orange-700 dark:bg-orange-300/15 dark:text-orange-200', hover: 'hover:border-orange-300 hover:shadow-orange-700/10' },
  { card: 'border-sky-200 bg-sky-50/80 dark:border-sky-300/20 dark:bg-sky-400/10', icon: 'bg-sky-100 text-sky-700 dark:bg-sky-300/15 dark:text-sky-200', hover: 'hover:border-sky-300 hover:shadow-sky-700/10' },
  { card: 'border-violet-200 bg-violet-50/80 dark:border-violet-300/20 dark:bg-violet-400/10', icon: 'bg-violet-100 text-violet-700 dark:bg-violet-300/15 dark:text-violet-200', hover: 'hover:border-violet-300 hover:shadow-violet-700/10' },
  { card: 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-300/20 dark:bg-emerald-400/10', icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-300/15 dark:text-emerald-200', hover: 'hover:border-emerald-300 hover:shadow-emerald-700/10' },
  { card: 'border-rose-200 bg-rose-50/80 dark:border-rose-300/20 dark:bg-rose-400/10', icon: 'bg-rose-100 text-rose-700 dark:bg-rose-300/15 dark:text-rose-200', hover: 'hover:border-rose-300 hover:shadow-rose-700/10' },
  { card: 'border-amber-200 bg-amber-50/80 dark:border-amber-300/20 dark:bg-amber-400/10', icon: 'bg-amber-100 text-amber-700 dark:bg-amber-300/15 dark:text-amber-200', hover: 'hover:border-amber-300 hover:shadow-amber-700/10' },
]

const featureTones = [
  { card: 'border-cyan-200 bg-cyan-50/80 dark:border-cyan-300/20 dark:bg-cyan-400/10', icon: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-300/15 dark:text-cyan-200' },
  { card: 'border-fuchsia-200 bg-fuchsia-50/80 dark:border-fuchsia-300/20 dark:bg-fuchsia-400/10', icon: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-300/15 dark:text-fuchsia-200' },
  { card: 'border-lime-200 bg-lime-50/80 dark:border-lime-300/20 dark:bg-lime-400/10', icon: 'bg-lime-100 text-lime-700 dark:bg-lime-300/15 dark:text-lime-200' },
  { card: 'border-blue-200 bg-blue-50/80 dark:border-blue-300/20 dark:bg-blue-400/10', icon: 'bg-blue-100 text-blue-700 dark:bg-blue-300/15 dark:text-blue-200' },
  { card: 'border-red-200 bg-red-50/80 dark:border-red-300/20 dark:bg-red-400/10', icon: 'bg-red-100 text-red-700 dark:bg-red-300/15 dark:text-red-200' },
  { card: 'border-purple-200 bg-purple-50/80 dark:border-purple-300/20 dark:bg-purple-400/10', icon: 'bg-purple-100 text-purple-700 dark:bg-purple-300/15 dark:text-purple-200' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
}

export function LandingPage() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className={`relative min-h-screen w-screen overflow-x-hidden bg-[#f7fbff] text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fbff_0%,#eef8ff_32%,#fff7ed_68%,#f6f3ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.24),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_46%,#111827_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />
        <div className="absolute left-0 top-28 h-80 w-full -skew-y-6 bg-white/45 dark:bg-white/5" />
      </div>

      <header className="fixed inset-x-0 top-0 z-[100] border-b border-sky-200/70 bg-gradient-to-r from-sky-50/95 via-white/95 to-amber-50/95 shadow-lg shadow-sky-900/5 backdrop-blur-xl dark:border-indigo-300/20 dark:bg-gradient-to-r dark:from-slate-950/95 dark:via-indigo-950/90 dark:to-slate-900/95 dark:shadow-black/20">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-5 sm:px-6 lg:px-8" aria-label="Landing navigation">
          <a href="#home" className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 text-white shadow-lg shadow-teal-600/25">
              <Cpu size={22} />
            </span>
            <span>
              <span className="block text-base font-black leading-tight text-slate-950 dark:text-white">BenchForge</span>
              <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300 sm:block">IICPC Platform</span>
            </span>
          </a>

          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300 lg:flex">
            <a href="#about" className="hover:text-teal-700 dark:hover:text-teal-300">About</a>
            <a href="#workflow" className="hover:text-orange-700 dark:hover:text-orange-300">Workflow</a>
            <a href="#features" className="hover:text-violet-700 dark:hover:text-violet-300">Features</a>
            <a href="#scoring" className="hover:text-rose-700 dark:hover:text-rose-300">Scoring</a>
            <a href="#contact" className="hover:text-emerald-700 dark:hover:text-emerald-300">Contact</a>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-indigo-300/20 dark:bg-indigo-950/80 dark:text-indigo-100 dark:hover:bg-indigo-900"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
            </button>
            <Link
              to="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50 px-5 py-3 text-sm font-bold text-sky-800 shadow-sm shadow-sky-900/5 transition-colors hover:from-sky-100 hover:to-cyan-100 dark:border-sky-300/20 dark:from-sky-400/15 dark:to-cyan-400/10 dark:text-sky-100 dark:hover:from-sky-400/20 dark:hover:to-cyan-400/15"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="hidden min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition-colors hover:from-teal-700 hover:to-indigo-700 sm:inline-flex"
            >
              Register
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-28 pt-24 sm:px-8 sm:pb-40 sm:pt-28 lg:px-10">
        <motion.section
          id="home"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid min-h-[calc(100vh-112px)] items-center gap-16 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20 lg:py-28"
        >
          <div>
            <motion.div variants={itemVariants} className="mb-6">
              <Badge variant="info" className="border-teal-200 bg-white/80 px-4 py-2 text-sm text-teal-700 shadow-sm backdrop-blur-md dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-200">
                <Sparkles className="mr-2 inline h-4 w-4" /> IICPC Summer Hackathon 2026
              </Badge>
            </motion.div>
            <motion.h1 variants={itemVariants} className="max-w-4xl text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-7xl">
              Distributed benchmarking for teams building at contest speed.
            </motion.h1>
            <motion.p variants={itemVariants} className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              BenchForge gives hackathon organizers and contestants a complete front door for code submission, isolated builds, load testing, telemetry, reports, and live ranking. It turns a complex infrastructure contest into a readable, repeatable experience.
            </motion.p>
            <motion.div variants={itemVariants} className="mt-10 flex flex-wrap gap-5">
              <Link to="/register" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-teal-600/25 transition-colors hover:from-teal-700 hover:to-indigo-700">
                Start Benchmarking <ArrowRight size={18} />
              </Link>
              <a href="#workflow" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-8 py-4 text-base font-bold text-amber-800 shadow-sm transition-colors hover:bg-amber-100 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200 dark:hover:bg-amber-300/15">
                See Workflow
              </a>
            </motion.div>
            <motion.div variants={itemVariants} className="mt-14 grid gap-6 sm:grid-cols-2">
              {proofPoints.map((point, idx) => (
                <div key={point} className={`flex min-h-24 items-start gap-4 rounded-3xl border p-5 text-sm font-semibold shadow-sm backdrop-blur-sm ${proofTones[idx % proofTones.length]}`}>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-500 dark:text-emerald-300" />
                  <span>{point}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-7 shadow-2xl shadow-blue-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85 dark:shadow-black/30 sm:p-10">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-300">
                    <Activity size={22} />
                  </span>
                  <div>
                    <p className="font-bold text-slate-950 dark:text-white">Live Benchmark Run</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Market simulation cluster</p>
                  </div>
                </div>
                <Badge variant="success">Recording</Badge>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {stats.map((stat, idx) => (
                  <div key={stat.label} className={`min-h-32 rounded-3xl border p-6 ${statTones[idx % statTones.length]}`}>
                    <p className="text-sm font-semibold opacity-75">{stat.label}</p>
                    <p className="mt-3 text-3xl font-black">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-3xl bg-slate-950 p-7 text-white dark:bg-black/40">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-semibold">Run timeline</span>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Stable</span>
                </div>
                <div className="space-y-5">
                  {['Build container', 'Deploy workers', 'Replay market traffic', 'Validate score'].map((item, index) => (
                    <div key={item} className="grid grid-cols-[1.75rem_1fr] gap-3 sm:grid-cols-[1.75rem_1fr_8rem] sm:items-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-400/15 text-xs font-black text-rose-200">{index + 1}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-300 via-rose-300 to-violet-300" style={{ width: `${96 - index * 14}%` }} />
                      </div>
                      <span className="col-span-2 text-sm text-slate-300 sm:col-span-1 sm:text-right">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        <section id="about" className="py-24">
          <div className="grid gap-12 rounded-[2rem] border border-emerald-200 bg-emerald-50/75 p-9 shadow-sm backdrop-blur-xl dark:border-emerald-300/20 dark:bg-emerald-400/10 sm:p-14 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">About BenchForge</p>
              <h2 className="mt-4 text-3xl font-black text-slate-950 dark:text-white sm:text-5xl">A contest platform for serious infrastructure benchmarks.</h2>
            </div>
            <div className="grid gap-5 text-base leading-8 text-slate-600 dark:text-slate-300">
              <p>
                Most hackathon platforms handle forms and submissions. BenchForge is built around the harder part: running submitted systems under realistic pressure, observing what happens, and making the result understandable to contestants and judges.
              </p>
              <p>
                The landing page gives participants a clear start, while the authenticated dashboard keeps the operational tools separate: submissions, deployments, benchmark sessions, reports, monitoring, and settings.
              </p>
            </div>
          </div>
        </section>

        <section id="workflow" className="py-24">
          <div className="mb-16 text-center">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-orange-700 dark:text-orange-300">Workflow</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white sm:text-5xl">From upload to leaderboard without manual glue.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-300">Each step is visible enough for participants and structured enough for organizers.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {workflowSteps.map((step, idx) => (
              (() => {
                const tone = workflowTones[idx % workflowTones.length]
                return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className={`group relative min-h-72 overflow-hidden rounded-3xl border p-9 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl dark:hover:bg-slate-900 ${tone.card} ${tone.hover}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors group-hover:bg-slate-950 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-950 ${tone.icon}`}>
                    <step.icon size={27} />
                  </div>
                  <span className="text-4xl font-black text-slate-300/80 transition-colors group-hover:text-slate-400 dark:text-white/15">{step.step}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-950 dark:text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{step.desc}</p>
              </motion.div>
                )
              })()
            ))}
          </div>
        </section>

        <section id="features" className="py-24">
          <div className="grid items-start gap-16 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-violet-700 dark:text-violet-300">Features</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white sm:text-5xl">Everything a benchmark website should explain up front.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
                Teams should know what is being measured, organizers should know what is operationally visible, and judges should know why the leaderboard is meaningful.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              {features.map((feature, idx) => (
                (() => {
                  const tone = featureTones[idx % featureTones.length]
                  return (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.04 }}
                  className={`min-h-64 rounded-3xl border p-9 shadow-sm backdrop-blur-xl ${tone.card}`}
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${tone.icon}`}>
                    <feature.icon size={21} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">{feature.label}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{feature.desc}</p>
                </motion.div>
                  )
                })()
              ))}
            </div>
          </div>
        </section>

        <section id="scoring" className="py-24">
          <div className="overflow-hidden rounded-[2rem] border border-rose-200 bg-slate-950 shadow-2xl shadow-slate-950/20 dark:border-rose-300/20">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="p-9 sm:p-14 lg:p-16">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-amber-300">Scoring Model</p>
                <h2 className="mt-3 text-3xl font-black text-white sm:text-5xl">Fast is useful only when it stays correct.</h2>
                <p className="mt-5 text-lg leading-8 text-slate-300">
                  BenchForge presents multiple signals together so participants can diagnose tradeoffs instead of chasing one number blindly.
                </p>
                <div className="mt-12 grid gap-6 sm:grid-cols-2">
                  {scoringSignals.map((signal) => (
                    <div key={signal.title} className="min-h-40 rounded-3xl border border-white/10 bg-white/5 p-8">
                      <h3 className="font-bold text-white">{signal.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{signal.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 p-9 sm:p-14 lg:p-16">
                <div className="rounded-3xl border border-white/50 bg-white p-9 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white sm:p-12">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">Sample scorecard</p>
                      <h3 className="mt-2 text-2xl font-black">Team VectorFlux</h3>
                    </div>
                    <Trophy className="text-amber-500" size={34} />
                  </div>
                  <div className="mt-6 space-y-5">
                    {[
                      ['Throughput', '92%'],
                      ['Latency', '87%'],
                      ['Correctness', '99%'],
                      ['Reliability', '94%'],
                    ].map(([label, width]) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm font-semibold">
                          <span>{label}</span>
                          <span>{width}</span>
                        </div>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-rose-500" style={{ width }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 py-24 lg:grid-cols-3">
          <div className="min-h-64 rounded-3xl border border-teal-200 bg-teal-50/80 p-10 shadow-sm backdrop-blur-xl dark:border-teal-300/20 dark:bg-teal-400/10">
            <Gauge className="text-teal-600 dark:text-teal-300" size={30} />
            <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">For contestants</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">A clear path from registration to submission, with reports that explain what to improve before the next attempt.</p>
          </div>
          <div className="min-h-64 rounded-3xl border border-violet-200 bg-violet-50/80 p-10 shadow-sm backdrop-blur-xl dark:border-violet-300/20 dark:bg-violet-400/10">
            <LockKeyhole className="text-violet-600 dark:text-violet-300" size={30} />
            <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">For organizers</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">A controlled benchmark pipeline that makes judging more consistent and reduces operational guesswork.</p>
          </div>
          <div className="min-h-64 rounded-3xl border border-amber-200 bg-amber-50/80 p-10 shadow-sm backdrop-blur-xl dark:border-amber-300/20 dark:bg-amber-400/10">
            <Cpu className="text-amber-600 dark:text-amber-300" size={30} />
            <h3 className="mt-5 text-xl font-bold text-slate-950 dark:text-white">For reviewers</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">Readable telemetry, scoring context, and session reports that turn infrastructure behavior into evidence.</p>
          </div>
        </section>

        <section id="contact" className="py-24">
          <div className="grid gap-12 rounded-[2rem] border border-sky-200 bg-sky-50/70 p-9 shadow-sm backdrop-blur-xl dark:border-sky-300/20 dark:bg-sky-400/10 sm:p-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">FAQ and Contact</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white sm:text-5xl">Need the dashboard? Start with login or team registration.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
                The landing page stays frontend-only. Use the buttons below to enter the existing app flows when you are ready.
              </p>
              <div className="mt-10 flex flex-wrap gap-5">
                <Link to="/login" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-4 font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
                  Login
                </Link>
                <Link to="/register" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-8 py-4 font-bold text-slate-950 shadow-lg shadow-amber-400/20 transition-colors hover:bg-amber-300">
                  Create a Team <ArrowRight size={18} />
                </Link>
              </div>
            </div>
            <div className="space-y-6">
              {faqItems.map((item, idx) => (
                <div key={item.q} className={`rounded-3xl border p-9 shadow-sm backdrop-blur-xl ${proofTones[idx % proofTones.length]}`}>
                  <h3 className="font-bold text-slate-950 dark:text-white">{item.q}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
