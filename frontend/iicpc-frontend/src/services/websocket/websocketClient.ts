import type { MetricSnapshot } from '@/types/api'

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
export type WebsocketMessageHandler<T> = (data: T) => void

interface WebsocketClientOptions {
  heartbeatInterval?: number
  reconnectDelay?: number
}

type RawMetricSnapshot = {
  tps?: number
  p50?: number
  p90?: number
  p99?: number
  failure_rate?: number
  total?: number
}

function normalizeMetricSnapshot(payload: unknown): MetricSnapshot | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const data = payload as RawMetricSnapshot

  return {
    timestamp: new Date().toISOString(),
    tps: typeof data.tps === 'number' ? data.tps : 0,
    p50: typeof data.p50 === 'number' ? data.p50 : 0,
    p90: typeof data.p90 === 'number' ? data.p90 : 0,
    p99: typeof data.p99 === 'number' ? data.p99 : 0,
    failureRate: typeof data.failure_rate === 'number' ? data.failure_rate : 0,
    total: typeof data.total === 'number' ? data.total : 0,
  }
}

export class WebsocketClient {
  private url: string
  private connection: WebSocket | null = null
  private handlers = new Set<WebsocketMessageHandler<MetricSnapshot>>()
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null
  private status: WebSocketStatus = 'disconnected'
  private readonly options: Required<WebsocketClientOptions>
  private manualClose = false

  constructor(url: string, options: WebsocketClientOptions = {}) {
    this.url = url
    this.options = {
      heartbeatInterval: options.heartbeatInterval ?? 20000,
      reconnectDelay: options.reconnectDelay ?? 3000,
    }
  }

  getStatus() {
    return this.status
  }

  addHandler(handler: WebsocketMessageHandler<MetricSnapshot>) {
    this.handlers.add(handler)
  }

  removeHandler(handler: WebsocketMessageHandler<MetricSnapshot>) {
    this.handlers.delete(handler)
  }

  connect() {
    if (this.connection) {
      return
    }

    this.manualClose = false
    this.setStatus('connecting')
    this.connection = new WebSocket(this.url)

    this.connection.addEventListener('open', () => {
      this.setStatus('connected')
      this.resetHeartbeat()
    })

    this.connection.addEventListener('message', (event) => {
      try {
        const rawPayload = JSON.parse(event.data)
        const payload = normalizeMetricSnapshot(rawPayload)

        if (payload) {
          this.handlers.forEach((handler) => handler(payload))
        } else {
          console.warn('Received unsupported websocket payload', rawPayload)
        }
      } catch (error) {
        console.warn('Malformed websocket payload', error)
      }
    })

    this.connection.addEventListener('close', () => {
      this.connection = null
      this.setStatus('disconnected')
      this.clearHeartbeat()
      if (!this.manualClose) {
        this.scheduleReconnect()
      }
    })

    this.connection.addEventListener('error', () => {
      this.setStatus('error')
      this.connection?.close()
    })
  }

  close() {
    this.manualClose = true
    if (this.connection) {
      this.connection.close()
      this.connection = null
    }
    this.clearHeartbeat()
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.setStatus('disconnected')
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return
    }
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, this.options.reconnectDelay)
  }

  private resetHeartbeat() {
    this.clearHeartbeat()
    this.heartbeatTimer = window.setInterval(() => {
      if (this.connection?.readyState === WebSocket.OPEN) {
        this.connection.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }))
      }
    }, this.options.heartbeatInterval)
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private setStatus(status: WebSocketStatus) {
    this.status = status
  }
}
