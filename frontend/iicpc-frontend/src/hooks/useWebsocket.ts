import { useEffect, useMemo, useState } from 'react'
import { getSharedWebsocketClient, type WebSocketStatus } from '@/services/websocket/websocketClient'
import type { MetricSnapshot, WorkerMetricMap } from '@/types/api'

export function useWebsocket() {
  const defaultUrl = typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8081/ws`
    : 'ws://localhost:8081/ws'

  const url = import.meta.env.VITE_WS_BASE_URL ?? defaultUrl
  const client = useMemo(() => getSharedWebsocketClient(url, { heartbeatInterval: 20000, historySize: 20 }), [url])

  const [status, setStatus] = useState<WebSocketStatus>(() => client.getStatus())
  const [latest, setLatest] = useState<MetricSnapshot | null>(() => client.getLatestSnapshot())
  const [history, setHistory] = useState<MetricSnapshot[]>(() => client.getHistory())
  const [workers, setWorkers] = useState<WorkerMetricMap>(() => client.getLatestWorkers())

  useEffect(() => {
    const statusHandler = (nextStatus: WebSocketStatus) => setStatus(nextStatus)
    const messageHandler = (payload: MetricSnapshot) => {
      setLatest(payload)
      setHistory(client.getHistory())
    }
    const workerHandler = (payload: WorkerMetricMap) => {
      setWorkers(payload)
    }

    client.addStatusHandler(statusHandler)
    client.addHandler(messageHandler)
    client.addWorkerHandler(workerHandler)
    client.connect()

    return () => {
      client.removeHandler(messageHandler)
      client.removeWorkerHandler(workerHandler)
      client.removeStatusHandler(statusHandler)
    }
  }, [client])

  return {
    status,
    latest,
    history,
    workers,
    reconnect: () => client.reconnect(),
  }
}
