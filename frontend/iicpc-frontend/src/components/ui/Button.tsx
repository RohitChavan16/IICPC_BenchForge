import type { ButtonHTMLAttributes } from 'react'
import type { Slot } from '@radix-ui/react-slot'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  asChild?: boolean
  className?: string
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-3xl border px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-50'

  const variantStyles = {
    primary: 'border-transparent bg-cyan-400 text-slate-950 hover:bg-cyan-300',
    secondary: 'border-white/10 bg-white/5 text-white hover:bg-white/10',
    ghost: 'border-transparent bg-transparent text-slate-300 hover:bg-white/5',
  }

  return (
    <button className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
