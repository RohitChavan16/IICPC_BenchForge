import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Users, LayoutDashboard, PlayCircle, Video } from 'lucide-react';

export function AdminSubmissionActionCenter() {
  const actions = [
    { title: 'View Queue', desc: 'Monitor execution pipelines', icon: LayoutDashboard, to: '/admin/queue', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', hover: 'hover:bg-indigo-500/5 hover:border-indigo-500/40' },
    { title: 'Open Benchmark', desc: 'Detailed execution data', icon: PlayCircle, to: '/benchmarks', color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', hover: 'hover:bg-cyan-500/5 hover:border-cyan-500/40' },
    { title: 'Team Management', desc: 'View contestant details', icon: Users, to: '/admin/teams', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hover: 'hover:bg-emerald-500/5 hover:border-emerald-500/40' },
    { title: 'Replay Configuration', desc: 'Manage visualizers', icon: Video, to: '#', color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20', hover: 'hover:bg-violet-500/5 hover:border-violet-500/40' },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Admin Action Center</h2>
        <p className="text-sm text-muted-foreground">Quick access to essential operational consoles.</p>
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
