import React from 'react'
import { Search, RefreshCw, Code, MinusCircle, CalendarDays } from 'lucide-react'

export interface FilterState {
  search: string
  language: string
  status: string
  date: string
}

interface SubmissionFiltersBarProps {
  filters: FilterState
  setFilters: (filters: FilterState) => void
  onRefresh: () => void
  isRefreshing: boolean
}

export function SubmissionFiltersBar({ filters, setFilters, onRefresh, isRefreshing }: SubmissionFiltersBarProps) {
  return (
    <div className="flex flex-col xl:flex-row gap-6 items-center justify-between w-full">
      <div className="flex-1 w-full xl:max-w-md relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" size={18} />
        <input 
          type="text"
          placeholder="Search by engine name, file, or ID..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="w-full bg-background dark:bg-[#1f2430] border border-border/50 hover:border-border rounded-xl pl-10 pr-14 py-2.5 text-sm outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-foreground placeholder:text-muted-foreground/70 shadow-sm dark:shadow-none"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center px-1.5 py-0.5 rounded bg-muted dark:bg-[#2a3040] border border-border/50 text-[10px] font-bold text-muted-foreground shadow-sm">
          <span className="font-sans mr-0.5">⌘</span>K
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 w-full xl:w-auto justify-start xl:justify-end">
        {/* Languages Dropdown */}
        <div className="relative">
          <Code className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <select 
            value={filters.language}
            onChange={(e) => setFilters({ ...filters, language: e.target.value })}
            className="bg-background dark:bg-[#1f2430] border border-border/50 hover:border-border rounded-xl pl-9 pr-8 py-2.5 text-sm outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all cursor-pointer appearance-none text-foreground shadow-sm dark:shadow-none"
          >
            <option value="all">All Languages</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="cpp">C++</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <MinusCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <select 
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-background dark:bg-[#1f2430] border border-border/50 hover:border-border rounded-xl pl-9 pr-8 py-2.5 text-sm outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all cursor-pointer appearance-none text-foreground shadow-sm dark:shadow-none"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>

        {/* Date Dropdown */}
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <select 
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="bg-background dark:bg-[#1f2430] border border-border/50 hover:border-border rounded-xl pl-9 pr-8 py-2.5 text-sm outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all cursor-pointer appearance-none text-foreground shadow-sm dark:shadow-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>

        {/* Refresh Button */}
        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2.5 bg-background dark:bg-[#1f2430] border border-border/50 rounded-xl hover:bg-muted dark:hover:bg-[#2a3040] hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 text-muted-foreground shadow-sm dark:shadow-none"
          title="Refresh Data"
        >
          <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>
    </div>
  )
}
