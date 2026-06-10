import { useQuery } from '@tanstack/react-query'
import { fetchProfile } from '@/services/api/authService'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Shield, 
  Users, 
  Fingerprint,
  Key,
  Edit3,
  Activity,
  AlertCircle
} from 'lucide-react'

export function ProfilePage() {
  const { data: user, isLoading, isError } = useQuery({ 
    queryKey: ['userProfile'], 
    queryFn: fetchProfile 
  })

  return (
    <div className="space-y-8">
      {/* Page Header / Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-slate-950 p-8 sm:p-12"
      >
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/80 to-blue-600/80 text-white shadow-xl shadow-primary/20 backdrop-blur-md border border-white/10">
              <User size={36} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {isLoading ? 'Loading Profile...' : user?.name}
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-400">
                Manage your identity, access, and security settings.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Account Active
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* Left Column: Account Details (Spans 2 cols on lg) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Fingerprint size={20} />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Identity & Metadata</h2>
            </div>

            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Activity className="animate-spin text-muted-foreground" size={24} />
              </div>
            ) : isError ? (
              <div className="flex h-40 flex-col items-center justify-center text-rose-500 gap-2">
                <AlertCircle size={24} />
                <p className="text-sm font-medium">Failed to load profile data.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {/* ID */}
                <div className="group rounded-2xl border border-border/50 bg-muted/30 p-5 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Fingerprint size={16} />
                    <p className="text-xs font-semibold uppercase tracking-wider">Account ID</p>
                  </div>
                  <p className="mt-2 truncate text-base font-medium text-foreground">{user?.id}</p>
                </div>

                {/* Name */}
                <div className="group rounded-2xl border border-border/50 bg-muted/30 p-5 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User size={16} />
                    <p className="text-xs font-semibold uppercase tracking-wider">Full Name</p>
                  </div>
                  <p className="mt-2 text-base font-medium text-foreground">{user?.name}</p>
                </div>

                {/* Email */}
                <div className="group rounded-2xl border border-border/50 bg-muted/30 p-5 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail size={16} />
                    <p className="text-xs font-semibold uppercase tracking-wider">Email Address</p>
                  </div>
                  <p className="mt-2 text-base font-medium text-foreground">{user?.email}</p>
                </div>

                {/* Team */}
                <div className="group rounded-2xl border border-border/50 bg-muted/30 p-5 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={16} />
                    <p className="text-xs font-semibold uppercase tracking-wider">Assigned Team</p>
                  </div>
                  <p className="mt-2 text-base font-medium text-foreground">{user?.team}</p>
                </div>

                {/* Role */}
                <div className="group sm:col-span-2 rounded-2xl border border-border/50 bg-muted/30 p-5 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield size={16} />
                    <p className="text-xs font-semibold uppercase tracking-wider">Platform Role</p>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <p className="text-base font-medium capitalize text-foreground">{user?.role}</p>
                    {user?.role === 'admin' && (
                      <span className="rounded bg-rose-500/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-500">
                        Elevated Privileges
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-foreground">Quick Actions</h2>
            
            <div className="flex flex-col gap-4">
              <button className="group flex w-full items-center justify-between rounded-2xl border border-border bg-background p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Edit Profile</p>
                    <p className="text-xs text-muted-foreground">Update your personal details</p>
                  </div>
                </div>
              </button>

              <button className="group flex w-full items-center justify-between rounded-2xl border border-border bg-background p-4 text-left transition-all hover:border-blue-500/50 hover:bg-blue-500/5 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white">
                    <Key size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Security & Password</p>
                    <p className="text-xs text-muted-foreground">Manage credentials and 2FA</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
