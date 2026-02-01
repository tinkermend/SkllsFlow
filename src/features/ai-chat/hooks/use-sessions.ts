import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useChatStore } from '@/stores/chat-store'
import { useAuthStore } from '@/stores/auth-store'
import { sessionApi } from '../api/session.api'
import type { CreateSessionParams } from '../types'

export function useSessions() {
  const { sessions, setSessions, connectionStatus } = useChatStore()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (connectionStatus !== 'connected') return

    const fetchSessions = async () => {
      setIsLoading(true)
      try {
        const data = await sessionApi.getAll()

        // 按更新时间降序排序（最新的在前面）
        const sortedData = [...data].sort((a, b) => {
          const timeA = a.time?.updated || a.time?.created || 0
          const timeB = b.time?.updated || b.time?.created || 0
          return timeB - timeA
        })

        setSessions(sortedData)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[useSessions] Error fetching sessions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessions()
  }, [connectionStatus, setSessions])

  return { data: sessions, isLoading }
}

export function useCreateSession() {
  const { addSession, setCurrentSession } = useChatStore()
  const { auth } = useAuthStore()

  return useMutation({
    mutationFn: async (params?: CreateSessionParams) => {
      // 从 auth store 获取 accountNo
      const accountNo = auth.user?.accountNo
      if (!accountNo) {
        throw new Error('用户未登录或账号信息缺失')
      }

      const session = await sessionApi.create({
        ...params,
        accountNo,
      })
      return session
    },
    onSuccess: (session) => {
      addSession(session)
      setCurrentSession(session.id)
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
