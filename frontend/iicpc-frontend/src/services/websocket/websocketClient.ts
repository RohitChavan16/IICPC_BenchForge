import type { MetricSnapshot } from '@/types/api'

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
export type WebsocketMessageHandler<T> = (data: T) => void
export type WebsocketStatusHandler = (status: WebSocketStatus) => void

interface WebsocketClientOptions {
  heartbeatInterval?: number
  reconnectBaseDelay?: number
  reconnectMaxDelay?: number
  historySize?: number
}

type RawMetricSnapshot = {
  timestamp?: string | number
  tps?: number
  p50?: number
  p90?: number
  p99?: number
  failure_rate?: number
  total?: number
  type?: string
  id?: number | string
}

export class RingBuffer<T> {
  private buffer: Array<T | undefined>
  private head = 0
  private size = 0

  constructor(private readonly capacity: number) {
    this.buffer = new Array(capacity)
  }

  push(value: T) {
    if (this.capacity <= 0) {
      return
    }

    const tailIndex = (this.head + this.size) % this.capacity
    this.buffer[tailIndex] = value

    if (this.size < this.capacity) {
      this.size += 1
      return
    }

    this.head = (this.head + 1) % this.capacity
  }

  toArray() {
    const snapshot: T[] = []
    for (let i = 0; i < this.size; i += 1) {
      const index = (this.head + i) % this.capacity
      const value = this.buffer[index]
      if (value !== undefined) {
        snapshot.push(value)
      }
    }
    return snapshot
  }

  clear() {
    this.buffer = new Array(this.capacity)
    this.head = 0
    this.size = 0
  }
}

function extractTimestamp(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number') {
    return new Date(value).toISOString()
  }

  return new Date().toISOString()
}

function normalizeMetricSnapshot(payload: unknown): MetricSnapshot | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const data = payload as RawMetricSnapshot

  return {
    timestamp: extractTimestamp(data.timestamp),
    tps: typeof data.tps === 'number' ? data.tps : 0,
    p50: typeof data.p50 === 'number' ? data.p50 : 0,
    p90: typeof data.p90 === 'number' ? data.p90 : 0,
    p99: typeof data.p99 === 'number' ? data.p99 : 0,
    failureRate: typeof data.failure_rate === 'number' ? data.failure_rate : 0,
    total: typeof data.total === 'number' ? data.total : 0,
  }
}

let sharedWebsocketClient: WebsocketClient | null = null

export function getSharedWebsocketClient(url: string, options: WebsocketClientOptions = {}) {
  if (!sharedWebsocketClient) {
    sharedWebsocketClient = new WebsocketClient(url, options)
  }

  return sharedWebsocketClient
}

export class WebsocketClient {
  private url: string
  private connection: WebSocket | null = null
  private handlers = new Set<WebsocketMessageHandler<MetricSnapshot>>()
  private statusHandlers = new Set<WebsocketStatusHandler>()
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null
  private pendingPong = false
  private lastPingSentAt = 0
  private lastMessageAt = 0
  private reconnectAttempt = 0
  private status: WebSocketStatus = 'disconnected'
  private readonly options: Required<WebsocketClientOptions>
  private manualClose = false
  private latestSnapshot: MetricSnapshot | null = null
  private history: RingBuffer<MetricSnapshot>

  constructor(url: string, options: WebsocketClientOptions = {}) {
    this.url = url
    this.options = {
      heartbeatInterval: options.heartbeatInterval ?? 20000,
      reconnectBaseDelay: options.reconnectBaseDelay ?? 1000,
      reconnectMaxDelay: options.reconnectMaxDelay ?? 16000,
      historySize: options.historySize ?? 20,
    }

    this.history = new RingBuffer<MetricSnapshot>(this.options.historySize)
  }

  getStatus() {
    return this.status
  }

  getLatestSnapshot() {
    return this.latestSnapshot
  }

  getHistory() {
    return this.history.toArray()
  }

  addHandler(handler: WebsocketMessageHandler<MetricSnapshot>) {
    this.handlers.add(handler)
  }

  removeHandler(handler: WebsocketMessageHandler<MetricSnapshot>) {
    this.handlers.delete(handler)
  }

  addStatusHandler(handler: WebsocketStatusHandler) {
    this.statusHandlers.add(handler)
  }

  removeStatusHandler(handler: WebsocketStatusHandler) {
    this.statusHandlers.delete(handler)
  }

  connect() {
    if (this.connection && this.connection.readyState !== WebSocket.CLOSED && this.connection.readyState !== WebSocket.CLOSING) {
      return
    }

    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.manualClose = false
    this.setStatus('connecting')
    this.connection = new WebSocket(this.url)

    this.connection.addEventListener('open', () => {
      this.reconnectAttempt = 0
      this.lastMessageAt = Date.now()
      this.pendingPong = false
      this.setStatus('connected')
      this.resetHeartbeat()
    })

    this.connection.addEventListener('message', (event) => {
      try {
        const rawPayload = JSON.parse(event.data)

        if (rawPayload && typeof rawPayload === 'object') {
          if (rawPayload.type === 'pong') {
            this.handlePong(rawPayload)
            return
          }

          if (rawPayload.type === 'ping') {
            this.sendPong(rawPayload.id)
            return
          }
        }

        const payload = normalizeMetricSnapshot(rawPayload)
        if (payload) {
          this.lastMessageAt = Date.now()
          this.latestSnapshot = payload
          this.history.push(payload)
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
      this.clearHeartbeat()
      this.setStatus('disconnected')
      if (!this.manualClose) {
        this.scheduleReconnect()
      }
    })

    this.connection.addEventListener('error', () => {
      this.setStatus('error')
      this.connection?.close()
    })
  }

  reconnect() {
    this.manualClose = false
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.connection) {
      this.connection.close()
      return
    }

    this.connect()
  }

  close() {
    this.manualClose = true

    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.connection) {
      this.connection.close()
      this.connection = null
    }

    this.clearHeartbeat()
    this.setStatus('disconnected')
  }

  private scheduleReconnect() {
    if (this.manualClose || this.reconnectTimer) {
      return
    }

    const delay = Math.min(
      this.options.reconnectMaxDelay,
      this.options.reconnectBaseDelay * 2 ** this.reconnectAttempt,
    )

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectAttempt += 1
      this.connect()
    }, delay)
  }

  private resetHeartbeat() {
    this.clearHeartbeat()
    this.sendPing()
    this.heartbeatTimer = window.setInterval(() => {
      if (this.connection?.readyState !== WebSocket.OPEN) {
        return
      }

      const now = Date.now()
      const staleThreshold = this.options.heartbeatInterval * 2

      if (this.pendingPong && now - this.lastPingSentAt > staleThreshold) {
        console.warn('WebSocket heartbeat timed out, reconnecting')
        this.triggerStaleReconnection()
        return
      }

      if (now - this.lastMessageAt > staleThreshold) {
        console.warn('WebSocket has become stale, reconnecting')
        this.triggerStaleReconnection()
        return
      }

      this.sendPing()
    }, this.options.heartbeatInterval)
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private sendPing() {
    if (this.connection?.readyState !== WebSocket.OPEN) {
      return
    }

    this.pendingPong = true
    this.lastPingSentAt = Date.now()
    this.connection.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }))
  }

  private sendPong(id?: string | number) {
    if (this.connection?.readyState !== WebSocket.OPEN) {
      return
    }

    const payload: Record<string, unknown> = {
      type: 'pong',
      timestamp: new Date().toISOString(),
    }

    if (id !== undefined) {
      payload.id = id
    }

    this.connection.send(JSON.stringify(payload))
  }

  private handlePong(payload: unknown) {
    this.pendingPong = false
    this.lastMessageAt = Date.now()
  }

  private triggerStaleReconnection() {
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      this.manualClose = false
      this.connection.close()
    }
  }

  private setStatus(status: WebSocketStatus) {
    if (this.status === status) {
      return
    }

    this.status = status
    this.statusHandlers.forEach((handler) => handler(status))
  }
}
