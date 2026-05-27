import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/stores/useAuthStore'
import { register as registerUser } from '@/services/api/authService'
import { useToast } from '@/components/ui/ToastProvider'

const registerSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
  name: z.string().min(2, 'Enter your full name'),
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.register)
  const { pushToast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  useEffect(() => {
    document.title = 'Register • IICPC BenchForge'
  }, [])

  const onSubmit = async (values: RegisterForm) => {
    const response = await registerUser({ email: values.email, password: values.password })
    setAuth(response.user, response.token)
    pushToast({ title: 'Account ready', description: 'Welcome to BenchForge.', variant: 'success' })
    navigate('/dashboard')
  }

  return (
    <div className="mx-auto flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        <Card className="space-y-8 p-10">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">Enterprise onboarding</p>
            <h1 className="text-3xl font-semibold text-white">Register your benchmark team</h1>
            <p className="text-sm leading-6 text-slate-400">Create a secure account to manage telemetry, worker pools, and benchmark sessions.</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300">Full name</label>
              <Input type="text" placeholder="Avery Morgan" {...register('name')} />
              {errors.name ? <p className="text-sm text-rose-400">{errors.name.message}</p> : null}
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300">Email</label>
              <Input type="email" placeholder="you@benchforge.io" {...register('email')} />
              {errors.email ? <p className="text-sm text-rose-400">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <Input type="password" placeholder="Create a secure password" {...register('password')} />
              {errors.password ? <p className="text-sm text-rose-400">{errors.password.message}</p> : null}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          <p className="text-sm text-slate-400">
            Already a member?{' '}
            <Link to="/login" className="text-cyan-300 hover:text-white">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
