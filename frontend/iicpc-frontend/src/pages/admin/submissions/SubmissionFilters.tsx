import { Search, Filter, Calendar, Users, Code2, Tag, SlidersHorizontal } from 'lucide-react'

export function SubmissionFilters() {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by Submission ID or Team Name..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        
        {/* Advanced Filters Button */}
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <SlidersHorizontal size={16} />
          Advanced Filters
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-slate-200 dark:border-slate-700">
          <Filter size={14} />
          Status: All
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-slate-200 dark:border-slate-700">
          <Code2 size={14} />
          Language: All
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-slate-200 dark:border-slate-700">
          <Users size={14} />
          Team: All
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-slate-200 dark:border-slate-700">
          <Calendar size={14} />
          Date: Last 24h
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-xs font-medium border border-slate-200 dark:border-slate-700">
          <Tag size={14} />
          Score: Any
        </button>
      </div>
    </div>
  )
}
