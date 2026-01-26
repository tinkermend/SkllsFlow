import { useQuery } from '@tanstack/react-query'
import { useChatStore } from '@/stores/chat-store'
import { commandApi } from '../api/command.api'

export function useCommands() {
  const { connectionStatus } = useChatStore()

  return useQuery({
    queryKey: ['ai-chat', 'commands'],
    queryFn: async () => {
      const commands = await commandApi.getAll()
      return commands
    },
    enabled: connectionStatus === 'connected',
    staleTime: 60000, // 1 minute
  })
}
