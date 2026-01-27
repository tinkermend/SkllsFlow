import { useEffect, useRef, useCallback, useState } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { createEventSource, type EventSourceManager } from '../api/event.api'
import type { SSEEvent, Message } from '../types'

export function useEventStream() {
  const {
    openCodeConnection,
    connectionStatus,
  } = useChatStore()

  const eventSourceRef = useRef<EventSourceManager | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const handleEvent = useCallback(
    (event: SSEEvent) => {
      const props = event.properties

      // 忽略心跳等无关事件
      if (!props || event.type === 'server.heartbeat') {
        return
      }

      // 获取 sessionID
      const sessionID =
        props.sessionID ||
        props.part?.sessionID ||
        (props.info as { sessionID?: string })?.sessionID

      // 直接从 store 获取最新状态，避免闭包问题
      const state = useChatStore.getState()
      const currentSessionId = state.currentSessionId

      // 记录所有事件（调试用）
      console.log('[SSE] Event:', event.type, { 
        eventSessionID: sessionID, 
        currentSessionId,
        props 
      })

      // 会话级别的事件（session.deleted, session.updated）不需要匹配当前会话
      const isSessionLevelEvent = event.type === 'session.deleted' || event.type === 'session.updated'

      // 只处理当前会话的事件（除了会话级别的事件）
      if (!isSessionLevelEvent) {
        if (sessionID && sessionID !== currentSessionId) {
          console.log('[SSE] Skipping event - session mismatch:', { sessionID, currentSessionId })
          return
        }

        if (!currentSessionId) {
          console.log('[SSE] Skipping event - no current session')
          return
        }
      }

      const {
        messagesBySession,
        appendMessage,
        updateMessage,
        setStreaming,
      } = state

      console.log('[SSE] Event received:', event.type, { sessionID, currentSessionId })

      switch (event.type) {
        case 'message.created':
        case 'message.updated': {
          // opencode 返回 info 而不是完整 message
          const info = props.info as Message['info'] | undefined
          console.log('[SSE] message.created/updated:', { info })
          
          if (info && currentSessionId) {
            // 检查是否已有此消息
            const existingMessages = messagesBySession[currentSessionId] || []
            const existingMsgIndex = existingMessages.findIndex(
              (m: Message) => m.info.id === info.id
            )

            console.log('[SSE] existingMsgIndex:', existingMsgIndex, 'total messages:', existingMessages.length)

            if (existingMsgIndex >= 0) {
              // 消息已存在，更新其 info
              updateMessage(currentSessionId, info.id, (msg) => ({
                ...msg,
                info: { ...msg.info, ...info },
              }))
              console.log('[SSE] Updated existing message:', info.id)
            } else {
              // 新消息，直接添加
              const message: Message = {
                info,
                parts: [],
              }
              appendMessage(currentSessionId, message)
              console.log('[SSE] Added new message:', info.id, info.role)

              // 如果是 assistant 消息，设置流状态
              if (info.role === 'assistant') {
                setStreaming(true, info.id)
              }
            }
          }
          break
        }

        case 'message.part.updated': {
          const part = props.part
          const delta = props.delta as string | undefined

          console.log('[SSE] message.part.updated:', {
            type: part?.type,
            messageID: part?.messageID,
            partId: (part as any)?.id,
            hasText: !!(part as any)?.text,
            textLength: (part as any)?.text?.length,
            delta: delta?.length,
          })

          if (part?.messageID && currentSessionId) {
            // 再次获取最新状态
            const latestState = useChatStore.getState()
            const currentMessages = latestState.messagesBySession[currentSessionId] || []
            const messageExists = currentMessages.some((m: Message) => m.info.id === part.messageID)
            
            console.log('[SSE] messageExists:', messageExists, 'for messageID:', part.messageID)
            
            if (!messageExists) {
              // 如果消息不存在，先创建一个占位消息
              console.log('[SSE] Creating placeholder message for part:', part.messageID)
              const placeholderMessage: Message = {
                info: {
                  id: part.messageID,
                  sessionID: currentSessionId,
                  role: 'assistant',
                  time: { created: Date.now() },
                },
                parts: [part],
              }
              latestState.appendMessage(currentSessionId, placeholderMessage)
              latestState.setStreaming(true, part.messageID)
            } else {
              latestState.updateMessage(currentSessionId, part.messageID, (msg) => {
                const partId = (part as { id?: string }).id
                const partIndex = msg.parts.findIndex(
                  (p) => (p as { id?: string }).id === partId
                )
                const newParts = [...msg.parts]
                
                if (partIndex >= 0) {
                  const existingPart = newParts[partIndex]
                  // 对 text/reasoning 类型使用增量更新（如果有 delta）
                  if (delta && (part.type === 'text' || part.type === 'reasoning')) {
                    newParts[partIndex] = {
                      ...existingPart,
                      ...part,
                      text: ((existingPart as any).text || '') + delta
                    }
                  } else {
                    // 整体替换 part
                    newParts[partIndex] = part
                  }
                } else {
                  // 新 part，直接添加
                  newParts.push(part)
                }
                
                console.log('[SSE] Updated message parts:', { 
                  messageId: part.messageID, 
                  partIndex, 
                  newPartsLength: newParts.length 
                })
                
                return { ...msg, parts: newParts }
              })
            }
          }
          break
        }

        case 'message.completed':
        case 'session.idle': {
          console.log('[SSE] Stream ended:', event.type)
          console.log('[SSE] Before setStreaming(false), current isStreaming:', useChatStore.getState().isStreaming)
          setStreaming(false)
          console.log('[SSE] After setStreaming(false), current isStreaming:', useChatStore.getState().isStreaming)
          break
        }

        case 'session.status': {
          const status = props.status?.type
          console.log('[SSE] session.status:', status)
          if (status === 'idle') {
            setStreaming(false)
          } else if (status === 'busy') {
            setStreaming(true)
          }
          break
        }

        case 'tool.invoked':
        case 'tool.completed': {
          // 工具调用事件
          break
        }

        case 'session.deleted':
        case 'session.updated': {
          // 会话被删除或更新
          // 注意：不在这里 invalidate queries，因为 mutation 已经处理了
          // 避免与 mutation 的 onSettled 产生竞争条件
          console.log('[SSE] Session changed:', event.type, { sessionID }, '(skipping invalidate)')
          break
        }

        case 'error': {
          console.error('[SSE] Server error:', props)
          setStreaming(false)
          break
        }

        default:
          // 记录所有未处理的事件类型
          console.log('[SSE] Unhandled event type:', event.type, event)
          break
      }
    },
    [] // 移除 queryClient 依赖
  )

  const connect = useCallback(() => {
    if (!openCodeConnection || connectionStatus !== 'connected') {
      return
    }

    // 如果已存在连接，先断开
    if (eventSourceRef.current) {
      eventSourceRef.current.disconnect()
    }

    eventSourceRef.current = createEventSource(
      openCodeConnection,
      handleEvent,
      (error) => {
        console.error('[SSE] Connection error:', error)
        setIsConnected(false)
      },
      () => {
        console.log('[SSE] Connection established')
        setIsConnected(true)
      }
    )

    eventSourceRef.current.connect()
  }, [openCodeConnection, connectionStatus, handleEvent])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.disconnect()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    if (connectionStatus === 'connected') {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [connectionStatus, connect, disconnect])

  return {
    reconnect: connect,
    disconnect,
    isConnected,
  }
}
