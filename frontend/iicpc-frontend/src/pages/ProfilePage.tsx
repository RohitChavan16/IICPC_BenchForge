import { useQuery } from '@tanstack/react-query'
import { fetchProfile } from '@/services/api/authService'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function ProfilePage() {
  const { data: user } = useQuery(['userProfile'], fetchProfile)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">User profile</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Profile</h1>
      </div>

      <Card title="Account details" description="Identity and access metadata.">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-6">
            <p className="text-sm text-slate-400">Full name</p>
            <p className="mt-3 text-lg font-semibold text-white">{user?.name ?? 'Loading...'}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-6">
            <p className="text-sm text-slate-400">Email</p>
            <p className="mt-3 text-lg font-semibold text-white">{user?.email ?? 'Loading...'}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-6">
            <p className="text-sm text-slate-400">Role</p>
            <p className="mt-3 text-lg font-semibold text-white">{user?.role ?? 'Loading...'}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-6">
            <p className="text-sm text-slate-400">Team</p>
            <p className="mt-3 text-lg font-semibold text-white">{user?.team ?? 'Loading...'}</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button variant="secondary">Edit profile</Button>
          <Button>Reset password</Button>
        </div>
      </Card>
    </div>
  )
}
