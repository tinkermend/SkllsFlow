import { useEffect, useCallback } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { backendApi } from '../api/backend.api'
import { initOpenCodeClient, destroyOpenCodeClient } from '../api/client'

export function useOpenCodeInit() {
  const {
    openCodeConnection,
    connectionStatus,
    setOpenCodeConnection,
    setConnectionStatus,
    clearOpenCodeConnection,
  } = useChatStore()

  const initConnection = useCallback(async () => {
    try {
      setConnectionStatus('connecting')

      // 调用 start 接口，会自动启动或复用已有实例
      const response = await backendApi.startOpenCode()

      if (response.status === 'starting') {
        // 服务启动中，1秒后重试
        setTimeout(initConnection, 1000)
        return
      }

      if (response.status === 'error') {
        setConnectionStatus('error')
        throw new Error(response.error || 'OpenCode service failed to start')
      }

      // 初始化 client
      const conn = response.opencode
      initOpenCodeClient(conn)
      setOpenCodeConnection(conn)
      setConnectionStatus('connected')
    } catch (error) {
      setConnectionStatus('error')
      console.error('Failed to initialize OpenCode connection:', error)
      throw error
    }
  }, [setConnectionStatus, setOpenCodeConnection])

  const disconnect = useCallback(() => {
    destroyOpenCodeClient()
    clearOpenCodeConnection()
  }, [clearOpenCodeConnection])

  useEffect(() => {
    if (!openCodeConnection && connectionStatus === 'disconnected') {
      initConnection().catch(() => {
        // 错误已在 initConnection 中处理
      })
    }

    return () => {
      // 组件卸载时不清理，保持连接
    }
  }, [openCodeConnection, connectionStatus, initConnection])

  return {
    isReady: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isError: connectionStatus === 'error',
    connectionStatus,
    reconnect: initConnection,
    disconnect,
  }
}
