import { motion } from 'framer-motion';
import { PauseCircle, PlayCircle, ListFilter, Cpu, Trash2, RotateCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function PipelineActionCenter() {
  const actions = [
    { label: 'Pause Pipelines', icon: PauseCircle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Resume Pipelines', icon: PlayCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'View Queue', icon: ListFilter, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { label: 'Scale Workers', icon: Cpu, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Process Dead Letters', icon: Trash2, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { label: 'Retry Failed', icon: RotateCw, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">Operational Action Center</h2>
        <p className="text-sm text-muted-foreground">Global controls for managing execution workflows and worker pools.</p>
      </div>

      <Card className="border-cyan-500/20 bg-gradient-to-r from-cyan-950/5 to-background p-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {actions.map((action, idx) => (
            <button
              key={idx}
              className={`group flex flex-col items-center justify-center gap-3 rounded-2xl border ${action.border} bg-background p-4 transition-all hover:scale-105 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            >
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${action.bg} ${action.color} transition-transform group-hover:scale-110`}>
                <action.icon size={24} />
              </div>
              <span className="text-xs font-semibold text-foreground text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </motion.section>
  );
}
