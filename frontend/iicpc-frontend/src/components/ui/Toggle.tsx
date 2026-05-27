interface ToggleProps {
  checked: boolean
  onClick: () => void
  className?: string
}

export function Toggle({ checked, onClick, className = '' }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-10 w-20 items-center rounded-full border border-white/10 bg-slate-950/90 px-1 transition ${className}`}
      aria-pressed={checked}
    >
      <span className="sr-only">Toggle option</span>
      <span
        className={`inline-flex h-8 w-8 transform items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-sm transition ${checked ? 'translate-x-10' : 'translate-x-0'}`}
      />
    </button>
  )
}
