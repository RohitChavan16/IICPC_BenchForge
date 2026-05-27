import { useEffect, useMemo, useState } from 'react'
import { WebsocketClient, type WebSocketStatus } from '@/services/websocket/websocketClient'
import type { MetricSnapshot } from '@/types/api'

export function useWebsocket() {
  const defaultUrl = typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8081/ws`
    : 'ws://localhost:8081/ws'

  const url = import.meta.env.VITE_WS_BASE_URL ?? defaultUrl
  const client = useMemo(() => new WebsocketClient(url, { reconnectDelay: 2500 }), [url])
  const [status, setStatus] = useState<WebSocketStatus>('connecting')
  const [latest, setLatest] = useState<MetricSnapshot | null>(null)
  const [history, setHistory] = useState<MetricSnapshot[]>([])

  useEffect(() => {
    const handler = (payload: MetricSnapshot) => {
      setLatest(payload)
      setHistory((current) => [...current.slice(-19), payload])
    }

    client.addHandler(handler)
    client.connect()

    const monitor = window.setInterval(() => {
      setStatus(client.getStatus())
    }, 500)

    return () => {
      client.removeHandler(handler)
      client.close()
      window.clearInterval(monitor)
    }
  }, [client])

  return {
    status,
    latest,
    history,
    reconnect: () => {
      client.close()
      client.connect()
    },
  }
}
