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

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must contain at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.login)
  const { pushToast } = useToast()

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
      navigate('/dashboard')
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message ?? 'Please check your credentials and try again.'
      pushToast({ title: 'Login failed', description: message, variant: 'error' })
    }
  }

  return (
    <div className="mx-auto flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        <Card className="space-y-8 p-10">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.32em] text-primary/80">Secure login</p>
            <h1 className="text-3xl font-semibold text-foreground">Access the benchmark command console</h1>
            <p className="text-sm leading-6 text-muted-foreground">Sign in to monitor live telemetry, start benchmark runs, and inspect worker health.</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <label htmlFor="login-email" className="block text-sm font-medium text-muted-foreground">Email</label>
              <Input id="login-email" type="email" autoComplete="email" placeholder="you@benchforge.io" aria-invalid={!!errors.email} {...register('email')} />
              {errors.email ? <p className="text-sm text-rose-400" role="alert">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="login-password" className="block text-sm font-medium text-muted-foreground">Password</label>
              <Input id="login-password" type="password" autoComplete="current-password" placeholder="Enter your password" aria-invalid={!!errors.password} {...register('password')} />
              {errors.password ? <p className="text-sm text-rose-400" role="alert">{errors.password.message}</p> : null}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Authenticating...' : 'Sign in'}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground">
            New to BenchForge?{' '}
            <Link to="/register" className="text-primary hover:text-foreground">
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
