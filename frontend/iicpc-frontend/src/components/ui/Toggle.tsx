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
      className={`relative inline-flex h-10 w-20 items-center rounded-full border border-input bg-muted px-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${className}`}
      aria-pressed={checked}
    >
      <span className="sr-only">Toggle option</span>
      <span
        className={`inline-flex h-8 w-8 transform items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-200 ${checked ? 'translate-x-10' : 'translate-x-0'}`}
      />
    </button>
  )
}
