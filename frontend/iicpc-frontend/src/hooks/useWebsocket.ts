import { useEffect, useMemo, useState } from 'react'
import { getSharedWebsocketClient, type WebSocketStatus } from '@/services/websocket/websocketClient'
import type { MetricSnapshot, WorkerMetricMap, PersonaMetricMap, TracerStats, LiveRequest } from '@/types/api'

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
  const [personas, setPersonas] = useState<PersonaMetricMap>(() => client.getLatestPersonas())
  const [tracerStats, setTracerStats] = useState<TracerStats>(() => client.getLatestTracerStats())
  const [requests, setRequests] = useState<LiveRequest[]>(() => client.getLatestRequests())

  useEffect(() => {
    const statusHandler = (nextStatus: WebSocketStatus) => setStatus(nextStatus)
    const messageHandler = (payload: MetricSnapshot) => {
      setLatest(payload)
      setHistory(client.getHistory())
    }
    const workerHandler = (payload: WorkerMetricMap) => {
      setWorkers(payload)
    }
    const personaHandler = (payload: PersonaMetricMap) => {
      setPersonas(payload)
    }
    const tracerHandler = (payload: TracerStats) => {
      setTracerStats(payload)
    }
    const requestHandler = (payload: LiveRequest[]) => {
      // Append requests to previous array up to a certain limit if needed
      // Actually, since this is a sampled stream, we'll just expose the latest batch 
      // and let the component handle accumulation.
      setRequests(payload)
    }

    client.addStatusHandler(statusHandler)
    client.addHandler(messageHandler)
    client.addWorkerHandler(workerHandler)
    client.addPersonaHandler(personaHandler)
    client.addTracerHandler(tracerHandler)
    client.addRequestHandler(requestHandler)
    client.connect()

    return () => {
      client.removeHandler(messageHandler)
      client.removeWorkerHandler(workerHandler)
      client.removePersonaHandler(personaHandler)
      client.removeTracerHandler(tracerHandler)
      client.removeRequestHandler(requestHandler)
      client.removeStatusHandler(statusHandler)
    }
  }, [client])

  return {
    status,
    latest,
    history,
    workers,
    personas,
    tracerStats,
    requests,
    reconnect: () => client.reconnect(),
  }
}
