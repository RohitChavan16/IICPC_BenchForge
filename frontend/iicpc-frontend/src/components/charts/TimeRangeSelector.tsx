import React from 'react'
import type { TimeWindow } from '@/services/prometheus/prometheusQueries'

type Props = {
  value: TimeWindow
  onChange: (v: TimeWindow) => void
}

export const TimeRangeSelector: React.FC<Props> = ({ value, onChange }) => {
  const options: TimeWindow[] = ['1m', '5m', '15m']

  return (
    <div className="flex items-center gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-full px-3 py-1 text-sm ${value === opt ? 'bg-cyan-500 text-slate-900' : 'bg-slate-900/60 text-white'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
