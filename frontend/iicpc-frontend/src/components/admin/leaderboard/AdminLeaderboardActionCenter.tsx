import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, FileCode, PlayCircle, BarChart3 } from 'lucide-react';

export function AdminLeaderboardActionCenter() {
  const actions = [
    { title: 'View All Submissions', desc: 'Inspect pipeline health', icon: FileCode, to: '/admin/submissions', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hover: 'hover:bg-amber-500/5 hover:border-amber-500/40' },
    { title: 'Team Directory', desc: 'Manage contestant info', icon: Users, to: '/admin/teams', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hover: 'hover:bg-orange-500/5 hover:border-orange-500/40' },
    { title: 'Live Benchmarks', desc: 'Monitor execution nodes', icon: PlayCircle, to: '/admin/queue', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hover: 'hover:bg-emerald-500/5 hover:border-emerald-500/40' },
    { title: 'Global Leaderboard', desc: 'View contestant perspective', icon: BarChart3, to: '/leaderboard', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', hover: 'hover:bg-blue-500/5 hover:border-blue-500/40' },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.3 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Admin Action Center</h2>
        <p className="text-sm text-muted-foreground">Quick access to essential operational consoles and public views.</p>
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
