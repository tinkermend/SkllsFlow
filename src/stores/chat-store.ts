import { create } from 'zustand'
import type {
  OpenCodeConnection,
  ConnectionStatus,
  Session,
  Message,
  ChatServer,
} from '@/features/ai-chat/types'
import { normalizeMessages } from '@/features/ai-chat/utils/message-normalization'

type ActiveChatServer = Pick<
  ChatServer,
  'id' | 'chatId' | 'name' | 'host' | 'port' | 'auth' | 'authPassword' | 'createdAt'
>

interface ChatState {
  // ========== OpenCode 连接 ==========
  openCodeConnection: OpenCodeConnection | null
  connectionStatus: ConnectionStatus
  setOpenCodeConnection: (conn: OpenCodeConnection) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  clearOpenCodeConnection: () => void
  activeServer: ActiveChatServer | null
  setActiveServer: (server: ChatServer | null) => void
  clearActiveServer: () => void
  resetConversations: () => void
  connectionNonce: number
  requestReconnect: () => void

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
  activeServer: null,
  setActiveServer: (server) =>
    set((state) => {
      if (!server) {
        return {
          activeServer: null,
          connectionStatus: 'disconnected',
          sessions: [],
          currentSessionId: null,
          messagesBySession: {},
          isStreaming: false,
          streamingMessageId: null,
        }
      }

      const isSameServer =
        state.activeServer && state.activeServer.chatId === server.chatId

      const minimalServer: ActiveChatServer = {
        id: server.id,
        chatId: server.chatId,
        name: server.name,
        host: server.host,
        port: server.port,
        auth: server.auth,
        authPassword: server.authPassword,
        createdAt: server.createdAt,
      }

      return {
        activeServer: minimalServer,
        ...(isSameServer
          ? {}
          : {
              connectionStatus: 'disconnected',
              sessions: [],
              currentSessionId: null,
              messagesBySession: {},
              isStreaming: false,
              streamingMessageId: null,
            }),
      }
    }),
  clearActiveServer: () =>
    set({
      activeServer: null,
      connectionStatus: 'disconnected',
      sessions: [],
      currentSessionId: null,
      messagesBySession: {},
      isStreaming: false,
      streamingMessageId: null,
    }),
  resetConversations: () =>
    set({
      sessions: [],
      currentSessionId: null,
      messagesBySession: {},
      isStreaming: false,
      streamingMessageId: null,
    }),
  connectionNonce: 0,
  requestReconnect: () =>
    set((state) => ({ connectionNonce: state.connectionNonce + 1 })),

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
    set((state) => {
      const remainingSessions = state.sessions.filter((s) => s.id !== id)
      const nextSessionId =
        state.currentSessionId === id ? remainingSessions[0]?.id ?? null : state.currentSessionId

      return {
        sessions: remainingSessions,
        currentSessionId: nextSessionId,
        messagesBySession: Object.fromEntries(
          Object.entries(state.messagesBySession).filter(([key]) => key !== id)
        ),
      }
    }),

  // 消息管理
  messagesBySession: {},
  setMessages: (sessionId, messages) =>
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: normalizeMessages(messages),
      },
    })),
  appendMessage: (sessionId, message) =>
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: [
          ...(state.messagesBySession[sessionId] || []),
          ...normalizeMessages([message]),
        ],
      },
    })),
  updateMessage: (sessionId, messageId, updater) =>
    set((state) => {
      const messages = state.messagesBySession[sessionId] || []
      const updated = messages.map((msg) =>
        msg.info?.id === messageId ? updater(msg) : msg
      )
      return {
        messagesBySession: { ...state.messagesBySession, [sessionId]: updated },
      }
    }),
  updateLastMessage: (sessionId, updater) =>
    set((state) => {
      const messages = state.messagesBySession[sessionId] || []
      if (messages.length === 0) return state
      const lastMessage = messages[messages.length - 1]
      if (!lastMessage?.info) return state
      const updated = [...messages]
      updated[updated.length - 1] = updater(lastMessage)
      return {
        messagesBySession: { ...state.messagesBySession, [sessionId]: updated },
      }
    }),

  // 流状态
  isStreaming: false,
  streamingMessageId: null,
  setStreaming: (status, messageId = null) => {
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
