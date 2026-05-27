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
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Platform settings</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Settings</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Appearance" description="Control theme and display behavior.">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/75 p-5">
              <div>
                <p className="font-semibold text-white">Dark mode</p>
                <p className="mt-1 text-sm text-slate-400">Toggle the application theme.</p>
              </div>
              <Toggle checked={theme === 'dark'} onClick={toggleTheme} />
            </div>
          </div>
        </Card>

        <Card title="Notifications" description="Alert workflow and observability preferences.">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/75 p-5">
              <div>
                <p className="font-semibold text-white">Notification emails</p>
                <p className="mt-1 text-sm text-slate-400">Keep platform alerts enabled for critical issues.</p>
              </div>
              <Toggle checked={notificationsEnabled} onClick={() => setNotificationsEnabled((prev) => !prev)} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/75 p-5">
              <div>
                <p className="font-semibold text-white">Anomaly detection</p>
                <p className="mt-1 text-sm text-slate-400">Auto-detect telemetry drift and abnormal behavior.</p>
              </div>
              <Toggle checked={anomalyDetection} onClick={() => setAnomalyDetection((prev) => !prev)} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
