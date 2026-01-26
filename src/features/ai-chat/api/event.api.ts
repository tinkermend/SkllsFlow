import type { OpenCodeConnection, SSEEvent } from '../types'
import { getBaseUrl } from './client'

export type EventCallback = (event: SSEEvent) => void
export type ErrorCallback = (error: Event) => void

export interface EventSourceManager {
  connect: () => void
  disconnect: () => void
  isConnected: () => boolean
}

/**
 * 创建 SSE 事件源管理器
 * 使用 /global/event 端点订阅全局事件
 */
export function createEventSource(
  connection: OpenCodeConnection,
  onEvent: EventCallback,
  onError?: ErrorCallback,
  onOpen?: () => void
): EventSourceManager {
  let eventSource: EventSource | null = null
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  const reconnectDelay = 3000

  const connect = () => {
    if (eventSource) {
      eventSource.close()
    }

    // 使用 /global/event 端点，与 opencode SDK 保持一致
    const url = `${getBaseUrl(connection)}/global/event`
    console.log('[SSE] Connecting to:', url)

    // 注意: EventSource 不支持自定义 headers
    // 如果需要认证，可能需要使用其他方式（如 URL 参数或后端代理）
    eventSource = new EventSource(url)

    eventSource.onopen = () => {
      console.log('[SSE] Connected')
      onOpen?.()
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // /global/event 返回的事件格式可能是 { directory, payload } 或直接是 event
        // 根据 opencode SDK 的处理方式，事件可能包装在 payload 中
        if (data.payload) {
          // 格式: { directory: string, payload: SSEEvent }
          onEvent(data.payload as SSEEvent)
        } else {
          // 直接是 SSEEvent 格式
          onEvent(data as SSEEvent)
        }
      } catch (e) {
        console.error('[SSE] Parse error:', e, 'Raw data:', event.data)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[SSE] Error:', error)
      onError?.(error)

      // 自动重连
      if (eventSource?.readyState === EventSource.CLOSED) {
        reconnectTimeout = setTimeout(connect, reconnectDelay)
      }
    }
  }

  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    if (eventSource) {
      eventSource.close()
      eventSource = null
      console.log('[SSE] Disconnected')
    }
  }

  const isConnected = () => {
    return eventSource?.readyState === EventSource.OPEN
  }

  return {
    connect,
    disconnect,
    isConnected,
  }
}

/**
 * 使用 fetch + ReadableStream 实现带认证的 SSE
 * (EventSource 不支持自定义 headers)
 */
export async function createAuthenticatedEventStream(
  connection: OpenCodeConnection,
  onEvent: EventCallback,
  onError?: (error: Error) => void,
  signal?: AbortSignal
): Promise<void> {
  const url = `${getBaseUrl(connection)}/event`

  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'Cache-Control': 'no-cache',
  }

  // 添加认证头
  if (connection.password) {
    const credentials = btoa(
      `${connection.username || 'opencode'}:${connection.password}`
    )
    headers['Authorization'] = `Basic ${credentials}`
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // 解析 SSE 消息
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6)) as SSEEvent
            onEvent(data)
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      onError?.(error)
    }
  }
}
