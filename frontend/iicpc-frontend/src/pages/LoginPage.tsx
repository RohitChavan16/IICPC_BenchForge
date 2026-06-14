import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/stores/useAuthStore'
import { login } from '@/services/api/authService'
import { useToast } from '@/components/ui/ToastProvider'
import { useThemeStore } from '@/stores/useThemeStore'
import { motion } from 'framer-motion'
import { SunMedium, Moon, Activity, ShieldCheck, Zap, Server, ArrowLeft } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must contain at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.login)
  const { pushToast } = useToast()
  const { theme, toggleTheme } = useThemeStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    document.title = 'Login • IICPC BenchForge'
  }, [])

  const onSubmit = async (values: LoginForm) => {
    try {
      const response = await login({ email: values.email, password: values.password })
      setAuth(response.user, response.token)
      pushToast({ title: 'Welcome back', description: 'You are now authenticated.', variant: 'success' })
      if (values.email === 'admin@benchforge.io') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message ?? 'Please check your credentials and try again.'
      pushToast({ title: 'Login failed', description: message, variant: 'error' })
    }
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background transition-colors duration-300">
      
      {/* Floating Back to Home Button */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute left-1/2 top-8 z-50 -translate-x-1/2"
      >
        <Link 
          to="/" 
          className="group flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-4 py-2 text-sm font-medium text-muted-foreground shadow-lg shadow-black/5 backdrop-blur-xl transition-all hover:scale-105 hover:bg-accent hover:text-foreground hover:border-border"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>
      </motion.div>

      {/* LEFT COLUMN: Info Panel (Hidden on Mobile) */}
      <div className="relative hidden w-1/2 flex-col justify-center gap-16 overflow-hidden border-r border-border bg-slate-50 dark:bg-slate-950 p-12 lg:flex">
        {/* Background glow effects */}
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,rgba(0,0,0,0.1),rgba(0,0,0,0))] dark:[mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-50 dark:opacity-10"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Activity size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">BenchForge</span>
          </div>
          
          <h1 className="mt-8 text-4xl font-black text-slate-900 dark:text-white leading-tight xl:text-5xl">
            Enterprise-Grade <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500 dark:from-primary dark:to-blue-400">Benchmark Orchestration</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-slate-600 dark:text-slate-400 xl:text-xl">
            Monitor live telemetry, coordinate extreme-scale distributed loads, and generate high-fidelity execution replays.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10 grid gap-6"
        >
          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-100/50 p-5 backdrop-blur-md transition-colors hover:bg-slate-200/50 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Live Telemetry & TPS</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Real-time throughput metrics streaming directly from edge workers via WebSockets.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-100/50 p-5 backdrop-blur-md transition-colors hover:bg-slate-200/50 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Server size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Distributed Load Generation</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Coordinate multi-node worker clusters to stress-test your system architectures.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-100/50 p-5 backdrop-blur-md transition-colors hover:bg-slate-200/50 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10">
            <div className="rounded-lg bg-violet-100 p-2 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Actionable Replays</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Instantly generate historical execution replays for deep debugging and performance profiling.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT COLUMN: Auth Panel */}
      <div className="relative flex w-full flex-col items-center justify-center lg:w-1/2 p-6">
        {/* Theme Toggle Top Right */}
        <div className="absolute right-8 top-8">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Secure Authentication</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">Sign in to access the BenchForge command console.</p>
          </div>

          <Card className="border-border/50 bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-sm font-medium text-foreground">Work Email</label>
                <Input 
                  id="login-email" 
                  type="email" 
                  autoComplete="email" 
                  placeholder="you@benchforge.io" 
                  className="bg-muted/50 focus:bg-background"
                  aria-invalid={!!errors.email} 
                  {...register('email')} 
                />
                {errors.email ? <p className="text-xs font-semibold text-rose-500" role="alert">{errors.email.message}</p> : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-sm font-medium text-foreground">Password</label>
                  <a href="#" className="text-xs font-semibold text-primary hover:underline">Forgot password?</a>
                </div>
                <Input 
                  id="login-password" 
                  type="password" 
                  autoComplete="current-password" 
                  placeholder="••••••••" 
                  className="bg-muted/50 focus:bg-background"
                  aria-invalid={!!errors.password} 
                  {...register('password')} 
                />
                {errors.password ? <p className="text-xs font-semibold text-rose-500" role="alert">{errors.password.message}</p> : null}
              </div>

              <Button type="submit" className="h-11 w-full text-base font-semibold shadow-md transition-all hover:scale-[1.02]" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Activity size={16} className="animate-spin" /> Authenticating...
                  </span>
                ) : (
                  'Sign In to Console'
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Request Access
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
