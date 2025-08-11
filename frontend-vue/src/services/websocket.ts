import type { WebSocketEvent } from '@/types'

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 1000
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map()

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    // In development, connect to backend server (port 3000)
    // In production, use same host as frontend
    const isDev = import.meta.env.DEV
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = isDev ? 'localhost:3000' : window.location.host
    const wsUrl = `${protocol}//${host}`

    try {
      this.ws = new WebSocket(wsUrl)
      this.setupEventListeners()
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      this.scheduleReconnect()
    }
  }

  private setupEventListeners() {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this.emit('connected', null)
    }

    this.ws.onmessage = (event) => {
      try {
        const data: WebSocketEvent = JSON.parse(event.data)
        console.log('WebSocket raw message received:', event.data)
        console.log('Parsed WebSocket data:', data)
        this.emit(data.type, data.data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error, 'Raw data:', event.data)
      }
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      this.emit('disconnected', { code: event.code, reason: event.reason })
      
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', error)
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    setTimeout(() => {
      this.connect()
    }, delay)
  }

  on(event: string, handler: (data: any) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler: (data: any) => void) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error)
        }
      })
    }
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.eventHandlers.clear()
    this.reconnectAttempts = 0
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const websocketService = new WebSocketService()