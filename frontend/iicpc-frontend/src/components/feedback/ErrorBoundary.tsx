import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface ErrorBoundaryState {
  hasError: boolean
  message?: string
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, message: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-6 px-6 text-center text-white">
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-10 shadow-glow backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.36em] text-cyan-300/80">Runtime failure</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Unexpected error</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              The application experienced an unexpected failure. Refresh the page or try again.
            </p>
            <p className="mt-4 text-sm text-slate-400">{this.state.message}</p>
            <Button variant="secondary" className="mt-8" onClick={this.reset}>
              Recover UI
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
