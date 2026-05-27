import { AppShell } from './components/layout/AppShell'
import { AppRoutes } from './routes/AppRoutes'
import { ErrorBoundary } from './components/feedback/ErrorBoundary'
import { ToastProvider } from './components/ui/ToastProvider'
import { ThemeLoader } from './components/layout/ThemeLoader'

function App() {
  return (
    <ThemeLoader>
      <ToastProvider>
        <ErrorBoundary>
          <AppShell>
            <AppRoutes />
          </AppShell>
        </ErrorBoundary>
      </ToastProvider>
    </ThemeLoader>
  )
}

export default App
