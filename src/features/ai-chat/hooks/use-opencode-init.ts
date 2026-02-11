/* eslint-disable no-console */
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useChatStore } from '@/stores/chat-store'
import { initOpenCodeClient, destroyOpenCodeClient } from '../api/client'

export function useActiveServerConnection() {
  const {
    activeServer,
    setOpenCodeConnection,
    setConnectionStatus,
    clearOpenCodeConnection,
    resetConversations,
    connectionNonce,
  } = useChatStore()

  const connectToActiveServer = useCallback(async () => {
    if (!activeServer) {
      destroyOpenCodeClient()
      clearOpenCodeConnection()
      setConnectionStatus('disconnected')
      resetConversations()
      return
    }

    const targetServerId = activeServer.chatId

    try {
      setConnectionStatus('connecting')

      const conn = {
        host: activeServer.host,
        port: activeServer.port,
        ...(activeServer.auth && activeServer.authPassword
          ? { username: 'opencode', password: activeServer.authPassword }
          : {}),
      }

      initOpenCodeClient(conn)

      const latestServer = useChatStore.getState().activeServer
      if (latestServer?.chatId !== targetServerId) {
        destroyOpenCodeClient()
        return
      }

      setOpenCodeConnection(conn)
      setConnectionStatus('connected')
    } catch (error) {
      destroyOpenCodeClient()
      clearOpenCodeConnection()
      setConnectionStatus('error')
      resetConversations()
      toast.error('无法连接到当前智能服务，请检查服务状态')
      console.error('Failed to connect to ChatServer:', error)
    }
  }, [
    activeServer,
    connectionNonce,
    clearOpenCodeConnection,
    resetConversations,
    setConnectionStatus,
    setOpenCodeConnection,
  ])

  useEffect(() => {
    connectToActiveServer().catch(() => {})

    return () => {
      destroyOpenCodeClient()
      clearOpenCodeConnection()
      setConnectionStatus('disconnected')
    }
  }, [connectToActiveServer, clearOpenCodeConnection, setConnectionStatus])

  return { activeServer }
}
