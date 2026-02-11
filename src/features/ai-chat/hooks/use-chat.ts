/* eslint-disable no-console */
import { useCallback } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { messageApi } from '../api/message.api'
import { DEFAULT_MODEL_CONFIG } from '../config/feature-flags'

export function useChat() {
  const {
    currentSessionId,
    isStreaming,
    setStreaming,
    appendMessage,
    messagesBySession,
  } = useChatStore()

  const messages = currentSessionId
    ? messagesBySession[currentSessionId] || []
    : []

  const sendMessage = useCallback(
    async (content: string) => {
      console.log('[useChat] sendMessage called:', { 
        content: content.substring(0, 50), 
        currentSessionId, 
        isStreaming 
      })
      
      if (!currentSessionId || isStreaming || !content.trim()) {
        console.log('[useChat] sendMessage early return:', { 
          noSession: !currentSessionId, 
          isStreaming, 
          emptyContent: !content.trim() 
        })
        return
      }

      try {
        // 设置流状态
        console.log('[useChat] About to call setStreaming(true)')
        setStreaming(true)
        console.log('[useChat] setStreaming(true) called')

        // 调用 session.prompt API 发送消息
        // API 返回用户消息（包含服务端生成的 ID）
        const userMessage = await messageApi.prompt(currentSessionId, {
          agent: DEFAULT_MODEL_CONFIG.agent,
          model: DEFAULT_MODEL_CONFIG.model,
          parts: [{ type: 'text', text: content }],
        })

        console.log('[useChat] prompt API returned:', userMessage)

        // 使用服务端返回的消息添加到列表
        // 检查是否已存在（SSE 可能已经添加）
        const state = useChatStore.getState()
        const existingMessages = state.messagesBySession[currentSessionId] || []
        const exists = existingMessages.some(m => m.info.id === userMessage.info.id)
        
        if (!exists) {
          appendMessage(currentSessionId, userMessage)
          console.log('[useChat] User message appended:', userMessage.info.id)
        } else {
          console.log('[useChat] User message already exists (from SSE):', userMessage.info.id)
        }

        // AI 响应通过 SSE 事件流推送，流状态由 session.idle 控制
      } catch (error) {
        console.error('Failed to send message:', error)
        setStreaming(false)
        throw error
      }
    },
    [currentSessionId, isStreaming, setStreaming, appendMessage]
  )

  const abortMessage = useCallback(async () => {
    if (!currentSessionId) return

    try {
      await messageApi.abort(currentSessionId)
      setStreaming(false)
    } catch (error) {
      console.error('Failed to abort:', error)
    }
  }, [currentSessionId, setStreaming])

  return {
    messages,
    sendMessage,
    abortMessage,
    isStreaming,
    currentSessionId,
  }
}
