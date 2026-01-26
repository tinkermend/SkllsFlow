import { useQuery } from '@tanstack/react-query'
import { useChatStore } from '@/stores/chat-store'
import { messageApi } from '../api/message.api'

export function useMessages(sessionId: string | null) {
  const { setMessages, connectionStatus } = useChatStore()

  return useQuery({
    queryKey: ['ai-chat', 'messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return []
      const messages = await messageApi.getBySessionId(sessionId)
      setMessages(sessionId, messages)
      return messages
    },
    enabled: !!sessionId && connectionStatus === 'connected',
    staleTime: 10000, // 10 seconds
  })
}
