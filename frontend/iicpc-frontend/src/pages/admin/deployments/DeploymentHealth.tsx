import { motion } from 'framer-motion'
import { ServerCrash, CheckCircle } from 'lucide-react'

export function DeploymentHealth() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 h-full">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-500" />
          Container Initialization Times
        </h3>
        <div className="flex-1 flex flex-col justify-end space-y-4">
          {/* Mock bar chart */}
          <div className="flex items-end h-32 gap-2">
            {[45, 60, 40, 80, 55, 30, 45, 50].map((val, idx) => (
              <div key={idx} className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-sm relative group">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className="absolute bottom-0 w-full bg-emerald-500 rounded-t-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>2 hours ago</span>
            <span>Now</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 h-full">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <ServerCrash size={16} className="text-rose-500" />
          OOM Terminations (Last 24h)
        </h3>
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="text-4xl font-bold text-slate-900 dark:text-slate-100">3</div>
          <p className="text-xs text-slate-500 mt-2 text-center max-w-[200px]">
            Containers killed by out-of-memory errors during benchmark runs.
          </p>
        </div>
      </div>
    </div>
  )
}
