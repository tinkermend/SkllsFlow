import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useChatStore } from '@/stores/chat-store'
import { useAuthStore } from '@/stores/auth-store'
import { sessionApi } from '../api/session.api'
import type { CreateSessionParams } from '../types'

export const MAX_SESSIONS_PER_SERVICE = 3

export function useSessions() {
  const {
    sessions,
    setSessions,
    setCurrentSession,
    connectionStatus,
    activeServer,
  } = useChatStore()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!activeServer) {
      setIsLoading(false)
      setSessions([])
      setCurrentSession(null)
      return
    }

    if (connectionStatus !== 'connected') {
      setIsLoading(true)
      return
    }

    let cancelled = false

    const fetchSessions = async () => {
      setIsLoading(true)
      try {
        const data = await sessionApi.getAll(activeServer.id)

        if (cancelled) return

        const sortedData = [...data].sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime()
          const timeB = new Date(b.updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })

        setSessions(sortedData)

        const { currentSessionId } = useChatStore.getState()
        if (sortedData.length === 0) {
          setCurrentSession(null)
        } else if (!currentSessionId || !sortedData.some((s) => s.sessionId === currentSessionId)) {
          setCurrentSession(sortedData[0].sessionId)
        }
      } catch (error) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error('[useSessions] Error fetching sessions:', error)
          toast.error('加载对话列表失败，请稍后重试')
          setSessions([])
          setCurrentSession(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchSessions()

    return () => {
      cancelled = true
    }
  }, [
    activeServer?.id,
    connectionStatus,
    setCurrentSession,
    setSessions,
  ])

  return { data: sessions, isLoading }
}

export function useCreateSession() {
  const { addSession, setCurrentSession, sessions, activeServer } = useChatStore()
  const { auth } = useAuthStore()

  return useMutation({
    mutationFn: async (params?: CreateSessionParams) => {
      if (!activeServer) {
        throw new Error('请先选择一个智能服务')
      }

      if (sessions.length >= MAX_SESSIONS_PER_SERVICE) {
        throw new Error('每个服务最多 3 个会话')
      }

      const accountNo = auth.user?.accountNo
      if (!accountNo) {
        throw new Error('用户未登录或账号信息缺失')
      }

      const session = await sessionApi.create({
        ...params,
        accountNo,
        chatServerId: activeServer.chatId,
      })
      return session
    },
    onSuccess: (session) => {
      addSession(session)
      setCurrentSession(session.sessionId)
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '新建会话失败'
      toast.error(message)
    },
  })
}

export function useDeleteSession() {
  const { removeSession } = useChatStore()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await sessionApi.delete(sessionId)
      return sessionId
    },
    onSuccess: (sessionId) => {
      removeSession(sessionId)
    },
  })
}

export function useUpdateSession() {
  const { updateSession } = useChatStore()

  return useMutation({
    mutationFn: async ({
      sessionId,
      title,
    }: {
      sessionId: string
      title: string
    }) => {
      const session = await sessionApi.update(sessionId, { title })
      return session
    },
    onSuccess: (session) => {
      updateSession(session.id, session)
    },
  })
}
