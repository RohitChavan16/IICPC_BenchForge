import { useState } from 'react'
import { useThemeStore } from '@/stores/useThemeStore'
import { Card } from '@/components/ui/Card'
import { Toggle } from '@/components/ui/Toggle'

export function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [anomalyDetection, setAnomalyDetection] = useState(true)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Platform settings</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Settings</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Appearance" description="Control theme and display behavior.">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-background p-5">
              <div>
                <p className="font-semibold text-foreground">Dark mode</p>
                <p className="mt-1 text-sm text-muted-foreground">Toggle the application theme.</p>
              </div>
              <Toggle checked={theme === 'dark'} onClick={toggleTheme} />
            </div>
          </div>
        </Card>

        <Card title="Notifications" description="Alert workflow and observability preferences.">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-background p-5">
              <div>
                <p className="font-semibold text-foreground">Notification emails</p>
                <p className="mt-1 text-sm text-muted-foreground">Keep platform alerts enabled for critical issues.</p>
              </div>
              <Toggle checked={notificationsEnabled} onClick={() => setNotificationsEnabled((prev) => !prev)} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-background p-5">
              <div>
                <p className="font-semibold text-foreground">Anomaly detection</p>
                <p className="mt-1 text-sm text-muted-foreground">Auto-detect telemetry drift and abnormal behavior.</p>
              </div>
              <Toggle checked={anomalyDetection} onClick={() => setAnomalyDetection((prev) => !prev)} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
