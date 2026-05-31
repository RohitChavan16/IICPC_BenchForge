import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { X, CheckCircle, AlertTriangle } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'destructive'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextValue {
  toasts: ToastMessage[]
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `${toast.title}-${Date.now()}`
    setToasts((current) => [
      ...current,
      {
        id,
        variant: toast.variant ?? 'info',
        ...toast,
      },
    ])
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const contextValue = useMemo(() => ({ toasts, pushToast }), [toasts, pushToast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-3xl border border-white/10 bg-slate-900/95 p-4 shadow-xl backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${toast.variant === 'error' || toast.variant === 'destructive' ? 'text-rose-400' : toast.variant === 'warning' ? 'text-amber-400' : 'text-cyan-300'}`}>
                {toast.variant === 'error' || toast.variant === 'destructive' || toast.variant === 'warning' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm text-slate-400">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-full p-1 text-slate-300 transition hover:text-white"
                aria-label="Dismiss notification"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
