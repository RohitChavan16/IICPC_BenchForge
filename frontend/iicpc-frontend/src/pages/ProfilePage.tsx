import { useQuery } from '@tanstack/react-query'
import { fetchProfile } from '@/services/api/authService'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function ProfilePage() {
  const { data: user } = useQuery({ queryKey: ['userProfile'], queryFn: fetchProfile })

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">User profile</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Profile</h1>
      </div>

      <Card title="Account details" description="Identity and access metadata.">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-border bg-background p-6">
            <p className="text-sm text-muted-foreground">Full name</p>
            <p className="mt-3 text-lg font-semibold text-foreground">{user?.name ?? 'Loading...'}</p>
          </div>
          <div className="rounded-3xl border border-border bg-background p-6">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="mt-3 text-lg font-semibold text-foreground">{user?.email ?? 'Loading...'}</p>
          </div>
          <div className="rounded-3xl border border-border bg-background p-6">
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="mt-3 text-lg font-semibold text-foreground">{user?.role ?? 'Loading...'}</p>
          </div>
          <div className="rounded-3xl border border-border bg-background p-6">
            <p className="text-sm text-muted-foreground">Team</p>
            <p className="mt-3 text-lg font-semibold text-foreground">{user?.team ?? 'Loading...'}</p>
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
