import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, LayoutDashboard, FileCode, Trophy, Settings } from 'lucide-react';

export function AdminActionCenter() {
  const actions = [
    { title: 'Global Leaderboard', desc: 'View live competition standings', icon: Trophy, to: '/leaderboard', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hover: 'hover:bg-amber-500/5 hover:border-amber-500/40' },
    { title: 'All Submissions', desc: 'Manage contestant uploads', icon: FileCode, to: '/admin/submissions', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', hover: 'hover:bg-blue-500/5 hover:border-blue-500/40' },
    { title: 'Benchmark Queue', desc: 'Monitor execution pipelines', icon: LayoutDashboard, to: '/admin/queue', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hover: 'hover:bg-emerald-500/5 hover:border-emerald-500/40' },
    { title: 'Team Settings', desc: 'Configure platform access', icon: Settings, to: '#', color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20', hover: 'hover:bg-slate-500/5 hover:border-slate-500/40' },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Admin Action Center</h2>
        <p className="text-sm text-muted-foreground">Quick access to essential management consoles.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, idx) => (
          <Link 
            key={idx} 
            to={action.to}
            className={`group relative overflow-hidden rounded-[24px] border ${action.border} bg-background p-5 transition-all ${action.hover}`}
          >
            <div className="flex items-center gap-4">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${action.bg} ${action.color} transition-transform group-hover:scale-110`}>
                <action.icon size={20} />
              </div>
              <div>
                <p className="font-semibold text-foreground">{action.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{action.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
