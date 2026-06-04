import { useMemo } from 'react'
import { useWebsocket } from '@/hooks/useWebsocket'
import { Card } from '@/components/ui/Card'
import { LiveLineChart } from '@/components/charts/LiveLineChart'
import { Badge } from '@/components/ui/Badge'

export function LiveTelemetryPage() {
  const { status, latest, history, reconnect } = useWebsocket()

  const statusLabel = useMemo(() => {
    if (status === 'connected') return 'Connected'
    if (status === 'connecting') return 'Connecting'
    if (status === 'disconnected') return 'Disconnected'
    return 'Error'
  }, [status])

  const successRate = latest ? Math.max(0, Math.min(100, 100 - latest.failureRate)) : 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Real-time telemetry</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Live streaming metrics</h1>
        </div>
        <button
          type="button"
          onClick={reconnect}
          className="rounded-3xl border border-border bg-card px-4 py-3 text-sm text-foreground transition hover:bg-muted"
        >
          Reconnect stream
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.55fr]">
        <Card title="Telemetry stream" description="Live metrics from the backend WebSocket feed.">
          <LiveLineChart data={history} />
        </Card>

        <div className="space-y-6">
          <Card title="Connection state" description="WebSocket stream health and heartbeat status.">
            <div className="space-y-4">
              <div className="rounded-3xl border border-border bg-background p-5">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{statusLabel}</p>
              </div>
              {latest ? (
                <div className="grid gap-4">
                  <div className="rounded-3xl border border-border bg-background p-5">
                    <p className="text-sm text-muted-foreground">Current TPS</p>
                    <p className="mt-3 text-3xl font-semibold text-primary">{latest.tps.toFixed(0)}</p>
                  </div>
                  <div className="rounded-3xl border border-border bg-background p-5">
                    <p className="text-sm text-muted-foreground">Success rate</p>
                    <p className="mt-3 text-3xl font-semibold text-emerald-300">{successRate.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-3xl border border-border bg-background p-5">
                    <p className="text-sm text-muted-foreground">Active requests</p>
                    <p className="mt-3 text-3xl font-semibold text-foreground">{latest.total}</p>
                  </div>
                  <div className="rounded-3xl border border-border bg-background p-5">
                    <p className="text-sm text-muted-foreground">P99 latency</p>
                    <p className="mt-3 text-3xl font-semibold text-secondary">{latest.p99.toFixed(0)} ms</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-border bg-background p-5 text-muted-foreground">Waiting for live data from backend stream.</div>
              )}
            </div>
          </Card>
          <Card title="Stream diagnostics" description="Live event freshness and reliability.">
            <div className="grid gap-4">
              <div className="rounded-3xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">History points</p>
                  <Badge variant="info">{history.length}</Badge>
                </div>
              </div>
              <div className="rounded-3xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">Latest update</p>
                  <p className="text-sm text-foreground">{latest ? new Date(latest.timestamp).toLocaleTimeString() : '-'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
