import { useQuery } from '@tanstack/react-query'
import { getChatServerCapabilities } from '../api/chat-server.api'

export function useServiceCapabilities(chatId?: string | null) {
  return useQuery({
    queryKey: ['chat-server-capabilities', chatId],
    queryFn: () => getChatServerCapabilities(chatId as string),
    enabled: Boolean(chatId),
  })
}
