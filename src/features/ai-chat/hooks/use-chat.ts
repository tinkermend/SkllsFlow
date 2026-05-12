/* eslint-disable no-console */
import { useCallback } from 'react'
import { AI_CHAT_PROMPT_DEFAULTS } from '@/config/ai-chat'
import { useChatStore } from '@/stores/chat-store'
import { messageApi } from '../api/message.api'
import type { Message, SendMessageRequest } from '../types'

export const createLocalUserMessage = (sessionId: string, content: string): Message => ({
  info: {
    id: `msg_${crypto.randomUUID()}`,
    sessionID: sessionId,
    role: 'user',
    time: { created: Date.now() },
  },
  parts: [{ type: 'text', text: content }],
})

export const createPromptRequest = (
  message: Message,
  content: string
): SendMessageRequest => ({
  ...AI_CHAT_PROMPT_DEFAULTS,
  messageID: message.info.id,
  parts: [{ type: 'text', text: content }],
})

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
        const userMessage = createLocalUserMessage(currentSessionId, content)
        appendMessage(currentSessionId, userMessage)

        // 设置流状态
        console.log('[useChat] About to call setStreaming(true)')
        setStreaming(true)
        console.log('[useChat] setStreaming(true) called')

        // 调用 session.prompt API 发送消息
        // 这里只负责触发请求；实际回复通过 SSE 事件流接收
        await messageApi.prompt(
          currentSessionId,
          createPromptRequest(userMessage, content)
        )

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
