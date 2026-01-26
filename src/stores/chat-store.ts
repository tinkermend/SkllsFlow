import { create } from 'zustand'
import type {
  OpenCodeConnection,
  ConnectionStatus,
  Session,
  Message,
} from '@/features/ai-chat/types'

interface ChatState {
  // ========== OpenCode 连接 ==========
  openCodeConnection: OpenCodeConnection | null
  connectionStatus: ConnectionStatus
  setOpenCodeConnection: (conn: OpenCodeConnection) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  clearOpenCodeConnection: () => void

  // ========== 会话管理 ==========
  sessions: Session[]
  currentSessionId: string | null
  setSessions: (sessions: Session[]) => void
  setCurrentSession: (id: string | null) => void
  addSession: (session: Session) => void
  updateSession: (id: string, updates: Partial<Session>) => void
  removeSession: (id: string) => void

  // ========== 消息管理 ==========
  messagesBySession: Record<string, Message[]>
  setMessages: (sessionId: string, messages: Message[]) => void
  appendMessage: (sessionId: string, message: Message) => void
  updateMessage: (
    sessionId: string,
    messageId: string,
    updater: (msg: Message) => Message
  ) => void
  updateLastMessage: (
    sessionId: string,
    updater: (msg: Message) => Message
  ) => void

  // ========== 流状态 ==========
  isStreaming: boolean
  streamingMessageId: string | null
  setStreaming: (status: boolean, messageId?: string | null) => void

  // ========== [预留] Skills ==========
  pendingSkills: string[]
  setPendingSkills: (skills: string[]) => void
  clearPendingSkills: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  // OpenCode 连接
  openCodeConnection: null,
  connectionStatus: 'disconnected',
  setOpenCodeConnection: (conn) => set({ openCodeConnection: conn }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  clearOpenCodeConnection: () =>
    set({
      openCodeConnection: null,
      connectionStatus: 'disconnected',
    }),

  // 会话管理
  sessions: [],
  currentSessionId: null,
  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (id) => set({ currentSessionId: id }),
  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions],
    })),
  updateSession: (id, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSessionId:
        state.currentSessionId === id ? null : state.currentSessionId,
      messagesBySession: Object.fromEntries(
        Object.entries(state.messagesBySession).filter(([key]) => key !== id)
      ),
    })),

  // 消息管理
  messagesBySession: {},
  setMessages: (sessionId, messages) =>
    set((state) => ({
      messagesBySession: { ...state.messagesBySession, [sessionId]: messages },
    })),
  appendMessage: (sessionId, message) =>
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: [...(state.messagesBySession[sessionId] || []), message],
      },
    })),
  updateMessage: (sessionId, messageId, updater) =>
    set((state) => {
      const messages = state.messagesBySession[sessionId] || []
      const updated = messages.map((msg) =>
        msg.info.id === messageId ? updater(msg) : msg
      )
      return {
        messagesBySession: { ...state.messagesBySession, [sessionId]: updated },
      }
    }),
  updateLastMessage: (sessionId, updater) =>
    set((state) => {
      const messages = state.messagesBySession[sessionId] || []
      if (messages.length === 0) return state
      const updated = [...messages]
      updated[updated.length - 1] = updater(updated[updated.length - 1])
      return {
        messagesBySession: { ...state.messagesBySession, [sessionId]: updated },
      }
    }),

  // 流状态
  isStreaming: false,
  streamingMessageId: null,
  setStreaming: (status, messageId = null) => {
    console.log('[Store] setStreaming called:', {
      status,
      messageId,
      stack: new Error().stack?.split('\n').slice(1, 4).join('\n'),
    })
    set({
      isStreaming: status,
      streamingMessageId: messageId,
    })
  },

  // [预留] Skills
  pendingSkills: [],
  setPendingSkills: (skills) => set({ pendingSkills: skills }),
  clearPendingSkills: () => set({ pendingSkills: [] }),
}))
