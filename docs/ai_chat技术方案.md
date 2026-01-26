# AI Chat 功能技术开发文档

## 一、项目概述

### 1.1 功能描述

基于现有 `shadcn-admin` 项目，实现一个 AI Chat 对话功能。该功能通过调用 `opencode serve` 提供的 HTTP API 实现 AI 对话能力，支持流式响应、命令菜单、会话管理等特性。

### 1.2 核心特性

| 特性 | 描述 |
|------|------|
| 多用户隔离 | 每个用户拥有独立的 `opencode serve` 实例 |
| 流式响应 | 通过 SSE 实时接收 AI 输出 |
| 命令菜单 | 输入 `/` 触发命令列表 |
| 会话管理 | 创建、切换、删除会话 |
| 工具调用可视化 | 折叠展示 AI 的工具调用过程 |
| 扩展性预留 | Skills/MCP 插件系统接口预留 |

### 1.3 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | React 19 + Vite | 现有项目基础 |
| **UI 组件** | prompt-kit + shadcn/ui | AI 对话专用组件 |
| **状态管理** | Zustand | 轻量级状态管理 |
| **数据请求** | TanStack Query + Axios | 异步数据管理 |
| **路由** | TanStack Router | 现有项目路由 |
| **样式** | Tailwind CSS v4 | 现有项目样式系统 |
| **后端** | Node.js | 用户数据持久化 + RBAC |

---

## 二、整体架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend                                   │
│  ┌─────────────┐    ┌─────────────────────┐                          │
│  │ SessionList │    │     ChatPanel       │                          │
│  │ (左侧)      │    │     (右侧)          │                            │
│  └──────┬──────┘    └──────────┬──────────┘                          │
│         │                      │                                     │
│         └──────────────────────┼─────────────────────────────────────│
│                                ▼                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   Zustand Store                                 │ │
│  │  openCodeConnection | sessions | messages | isStreaming        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                │                                     │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your Backend  │    │   User A's      │    │   User B's      │
│   (统一入口)     │    │   OpenCode      │    │   OpenCode      │
│                 │    │   :4096         │    │   :4097         │
│ • 用户认证       │    └─────────────────┘    └─────────────────┘
│ • 数据持久化     │             ▲                     ▲
│ • OpenCode 管理  │             │                     │
│ • RBAC 权限      │─────────────┴─────────────────────┘
└─────────────────┘       启动/管理 OpenCode 实例
```

### 2.2 核心调用流程

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. 用户登录                                                          │
│    POST /api/auth/login → 后端启动用户专属 opencode serve            │
│                         → 返回 { user, opencode: { host, port } }   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. 初始化连接                                                        │
│    前端存储 opencode 连接信息 → 初始化 Axios Client                   │
│                              → 建立 SSE 连接                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. 会话管理                                                          │
│    GET  /session       → 获取会话列表                                │
│    POST /session       → 创建新会话                                  │
│    GET  /session/:id   → 获取会话详情                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. 对话交互                                                          │
│    POST /session/:id/prompt_async → 发送消息 (异步, 不阻塞)           │
│    GET  /event (SSE)              → 接收流式响应                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. 命令菜单                                                          │
│    输入 "/" → GET /command → 展示命令列表                            │
│            → 选择命令 → POST /session/:id/command                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 三、前端技术方案

### 3.1 目录结构

```
src/features/ai-chat/
├── api/
│   ├── client.ts                 # OpenCode Axios 实例 (动态 baseURL)
│   ├── backend.api.ts            # 后端 API (获取连接信息等)
│   ├── session.api.ts            # Session CRUD
│   ├── message.api.ts            # 发送消息 (prompt_async)
│   ├── command.api.ts            # GET /command
│   └── event.api.ts              # SSE 封装
│
├── hooks/
│   ├── use-opencode-init.ts      # 初始化 OpenCode 连接
│   ├── use-sessions.ts           # 会话列表 (TanStack Query)
│   ├── use-messages.ts           # 消息列表
│   ├── use-commands.ts           # 命令列表
│   ├── use-event-stream.ts       # SSE 订阅
│   ├── use-chat.ts               # 组合 Hook (发送+接收)
│   ├── use-available-skills.ts   # [预留] Skills 列表
│   └── use-mcp-servers.ts        # [预留] MCP 服务器列表
│
├── stores/
│   └── chat-store.ts             # Zustand 状态管理
│
├── components/
│   ├── connection-guard.tsx      # 连接状态守卫
│   ├── session-sidebar.tsx       # 左侧会话列表
│   ├── session-item.tsx          # 单个会话项
│   ├── chat-panel.tsx            # 主对话面板
│   ├── chat-input.tsx            # 输入框 (包装 PromptInput)
│   ├── message-list.tsx          # 消息列表
│   ├── message-item.tsx          # 单条消息 (包装 Message)
│   ├── tool-reasoning.tsx        # 工具调用折叠 (包装 Reasoning)
│   └── command-suggestions.tsx   # / 命令提示
│
├── types/
│   └── index.ts                  # 类型定义
│
├── config/
│   └── feature-flags.ts          # 功能开关
│
└── index.tsx                     # 页面入口
```

### 3.2 prompt-kit 组件安装

```bash
# 核心组件
npx shadcn add "https://prompt-kit.com/c/prompt-input.json"
npx shadcn add "https://prompt-kit.com/c/message.json"
npx shadcn add "https://prompt-kit.com/c/markdown.json"
npx shadcn add "https://prompt-kit.com/c/code-block.json"
npx shadcn add "https://prompt-kit.com/c/reasoning.json"
npx shadcn add "https://prompt-kit.com/c/chat-container.json"
npx shadcn add "https://prompt-kit.com/c/response-stream.json"
npx shadcn add "https://prompt-kit.com/c/prompt-suggestion.json"
npx shadcn add "https://prompt-kit.com/c/loader.json"
npx shadcn add "https://prompt-kit.com/c/scroll-button.json"
```

### 3.3 页面布局

```
┌────────────────────────────────────────────────────────────────┐
│  Header (复用现有)                                              │
├────────────┬───────────────────────────────────────────────────┤
│            │                                                   │
│  会话列表   │              对话区域                              │
│  ────────  │  ┌─────────────────────────────────────────────┐  │
│  + 新建会话 │  │  ChatContainer (auto-scroll)                │  │
│            │  │  ┌─────────────────────────────────────────┐│  │
│  ○ 会话 1  │  │  │ Message (user)                          ││  │
│  ● 会话 2  │  │  ├─────────────────────────────────────────┤│  │
│  ○ 会话 3  │  │  │ Message (assistant)                     ││  │
│            │  │  │  └─ Reasoning (tool calls 折叠)         ││  │
│            │  │  │  └─ MessageContent (markdown)           ││  │
│            │  │  └─────────────────────────────────────────┘│  │
│            │  └─────────────────────────────────────────────┘  │
│            │  ┌─────────────────────────────────────────────┐  │
│            │  │ PromptInput                                 │  │
│            │  │  [/] → PromptSuggestion (命令菜单)           │  │
│            │  └─────────────────────────────────────────────┘  │
│ (预留扩展)  │                                                   │
│ Skills/MCP │                                                   │
└────────────┴───────────────────────────────────────────────────┘
```

### 3.4 类型定义

```typescript
// types/index.ts

// ============ OpenCode 连接 ============
export interface OpenCodeConnection {
  host: string
  port: number
  password?: string
  username?: string
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

// ============ 会话 ============
export interface Session {
  id: string
  title: string
  parentID?: string
  createdAt: string
  updatedAt: string
  // [预留] Skills/MCP 关联
  skills?: string[]
  mcpServers?: string[]
}

export interface CreateSessionParams {
  title?: string
  parentID?: string
  // [预留]
  skills?: string[]
  mcpServers?: string[]
}

// ============ 消息 ============
export interface Message {
  info: MessageInfo
  parts: Part[]
}

export interface MessageInfo {
  id: string
  sessionID: string
  role: 'user' | 'assistant'
  createdAt: string
}

export type Part =
  | TextPart
  | ToolInvocationPart
  | ToolResultPart
  | FilePart

export interface TextPart {
  type: 'text'
  content: string
}

export interface ToolInvocationPart {
  type: 'tool-invocation'
  id: string
  toolName: string
  args: unknown
}

export interface ToolResultPart {
  type: 'tool-result'
  toolCallId: string
  result: unknown
}

export interface FilePart {
  type: 'file'
  path: string
  content: string
}

// ============ 命令 ============
export interface Command {
  name: string
  description: string
  args?: CommandArg[]
}

export interface CommandArg {
  name: string
  required: boolean
  description?: string
}

// ============ [预留] Skills/MCP ============
export interface Skill {
  id: string
  name: string
  description?: string
}

export interface McpServer {
  name: string
  status: 'connected' | 'disconnected' | 'error'
  tools?: string[]
}
```

### 3.5 状态管理 (Zustand)

```typescript
// stores/chat-store.ts
import { create } from 'zustand'
import type { 
  OpenCodeConnection, 
  ConnectionStatus, 
  Session, 
  Message 
} from '../types'

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
  removeSession: (id: string) => void

  // ========== 消息管理 ==========
  messagesBySession: Record<string, Message[]>
  setMessages: (sessionId: string, messages: Message[]) => void
  appendMessage: (sessionId: string, message: Message) => void
  updateLastMessage: (sessionId: string, updater: (msg: Message) => Message) => void

  // ========== 流状态 ==========
  isStreaming: boolean
  streamingMessageId: string | null
  setStreaming: (status: boolean, messageId?: string | null) => void

  // ========== [预留] Skills ==========
  pendingSkills: string[]
  setPendingSkills: (skills: string[]) => void
  clearPendingSkills: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  // OpenCode 连接
  openCodeConnection: null,
  connectionStatus: 'disconnected',
  setOpenCodeConnection: (conn) => set({ openCodeConnection: conn }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  clearOpenCodeConnection: () => set({ 
    openCodeConnection: null, 
    connectionStatus: 'disconnected' 
  }),

  // 会话管理
  sessions: [],
  currentSessionId: null,
  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (id) => set({ currentSessionId: id }),
  addSession: (session) => set((state) => ({ 
    sessions: [session, ...state.sessions] 
  })),
  removeSession: (id) => set((state) => ({
    sessions: state.sessions.filter((s) => s.id !== id),
    currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
  })),

  // 消息管理
  messagesBySession: {},
  setMessages: (sessionId, messages) => set((state) => ({
    messagesBySession: { ...state.messagesBySession, [sessionId]: messages },
  })),
  appendMessage: (sessionId, message) => set((state) => ({
    messagesBySession: {
      ...state.messagesBySession,
      [sessionId]: [...(state.messagesBySession[sessionId] || []), message],
    },
  })),
  updateLastMessage: (sessionId, updater) => set((state) => {
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
  setStreaming: (status, messageId = null) => set({ 
    isStreaming: status, 
    streamingMessageId: messageId 
  }),

  // [预留] Skills
  pendingSkills: [],
  setPendingSkills: (skills) => set({ pendingSkills: skills }),
  clearPendingSkills: () => set({ pendingSkills: [] }),
}))
```

### 3.6 API Client

```typescript
// api/client.ts
import axios, { type AxiosInstance } from 'axios'
import type { OpenCodeConnection } from '../types'

let openCodeClient: AxiosInstance | null = null

export function initOpenCodeClient(connection: OpenCodeConnection): AxiosInstance {
  const { host, port, username, password } = connection

  openCodeClient = axios.create({
    baseURL: `http://${host}:${port}`,
    timeout: 30000,
    ...(password && {
      auth: {
        username: username || 'opencode',
        password: password,
      },
    }),
  })

  return openCodeClient
}

export function getOpenCodeClient(): AxiosInstance {
  if (!openCodeClient) {
    throw new Error('OpenCode client not initialized. Please login first.')
  }
  return openCodeClient
}

export function destroyOpenCodeClient(): void {
  openCodeClient = null
}

export function isClientInitialized(): boolean {
  return openCodeClient !== null
}
```

### 3.7 核心 Hooks

#### use-opencode-init.ts

```typescript
// hooks/use-opencode-init.ts
import { useEffect, useCallback } from 'react'
import { useChatStore } from '../stores/chat-store'
import { initOpenCodeClient, destroyOpenCodeClient } from '../api/client'
import { backendApi } from '@/lib/backend-api'

interface OpenCodeConnectionResponse {
  opencode: {
    host: string
    port: number
    password?: string
    username?: string
  }
  status: 'ready' | 'starting' | 'error'
  error?: string
}

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
      
      const response = await backendApi.get<OpenCodeConnectionResponse>(
        '/api/opencode/connection'
      )
      
      if (response.data.status === 'starting') {
        // 服务启动中，1秒后重试
        setTimeout(initConnection, 1000)
        return
      }
      
      if (response.data.status === 'error') {
        setConnectionStatus('error')
        throw new Error(response.data.error || 'OpenCode service failed to start')
      }
      
      // 初始化 client
      const conn = response.data.opencode
      initOpenCodeClient(conn)
      setOpenCodeConnection(conn)
      setConnectionStatus('connected')
      
    } catch (error) {
      setConnectionStatus('error')
      throw error
    }
  }, [setConnectionStatus, setOpenCodeConnection])

  const disconnect = useCallback(() => {
    destroyOpenCodeClient()
    clearOpenCodeConnection()
  }, [clearOpenCodeConnection])

  useEffect(() => {
    if (!openCodeConnection) {
      initConnection()
    }
    
    return () => {
      // 组件卸载时不清理，保持连接
    }
  }, [])

  return {
    isReady: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isError: connectionStatus === 'error',
    connectionStatus,
    reconnect: initConnection,
    disconnect,
  }
}
```

#### use-event-stream.ts

```typescript
// hooks/use-event-stream.ts
import { useEffect, useRef, useCallback } from 'react'
import { useChatStore } from '../stores/chat-store'
import type { Part } from '../types'

export function useEventStream() {
  const { openCodeConnection, currentSessionId, appendMessage, setStreaming } = useChatStore()
  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (!openCodeConnection) return

    const { host, port } = openCodeConnection
    const url = `http://${host}:${port}/event`

    // 如果已存在连接，先关闭
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('[SSE] Connected')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // 过滤当前会话的事件
        if (data.sessionID && data.sessionID === currentSessionId) {
          handleEvent(data)
        }
      } catch (e) {
        console.error('[SSE] Parse error:', e)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[SSE] Error:', error)
      // 自动重连逻辑
      setTimeout(connect, 3000)
    }
  }, [openCodeConnection, currentSessionId])

  const handleEvent = useCallback((data: unknown) => {
    // 根据事件类型处理
    // 具体实现根据 OpenCode 的事件格式
  }, [appendMessage, setStreaming])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { reconnect: connect, disconnect }
}
```

#### use-chat.ts

```typescript
// hooks/use-chat.ts
import { useCallback } from 'react'
import { useChatStore } from '../stores/chat-store'
import { messageApi } from '../api/message.api'
import type { Part } from '../types'

export function useChat() {
  const {
    currentSessionId,
    isStreaming,
    setStreaming,
    appendMessage,
  } = useChatStore()

  const sendMessage = useCallback(async (content: string) => {
    if (!currentSessionId || isStreaming) return

    try {
      setStreaming(true)
      
      // 添加用户消息到本地
      appendMessage(currentSessionId, {
        info: {
          id: crypto.randomUUID(),
          sessionID: currentSessionId,
          role: 'user',
          createdAt: new Date().toISOString(),
        },
        parts: [{ type: 'text', content }],
      })

      // 异步发送，不等待响应 (响应通过 SSE 接收)
      await messageApi.sendAsync(currentSessionId, {
        parts: [{ type: 'text', text: content }],
      })
      
    } catch (error) {
      setStreaming(false)
      throw error
    }
  }, [currentSessionId, isStreaming, setStreaming, appendMessage])

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
    sendMessage,
    abortMessage,
    isStreaming,
  }
}
```

### 3.8 功能开关配置

```typescript
// config/feature-flags.ts
export const FEATURE_FLAGS = {
  // [预留] 是否要求选择 Skills 才能创建会话
  requireSkillsBeforeChat: false,
  
  // [预留] 是否显示 MCP 服务器选择
  enableMcpSelection: false,
  
  // [预留] 是否启用 Skills 面板
  enableSkillsPanel: false,
} as const

export type FeatureFlags = typeof FEATURE_FLAGS
```

### 3.9 扩展性预留

#### Skills 选择器 (预留接口)

```typescript
// hooks/use-available-skills.ts
import { useQuery } from '@tanstack/react-query'
import { getOpenCodeClient } from '../api/client'
import type { Skill } from '../types'

export function useAvailableSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async (): Promise<Skill[]> => {
      // [预留] 后续对接 GET /agent
      // const client = getOpenCodeClient()
      // const response = await client.get('/agent')
      // return response.data
      return []
    },
    enabled: false, // 当前禁用，后续开启
  })
}
```

#### 会话创建扩展点

```typescript
// hooks/use-create-session.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionApi } from '../api/session.api'
import { useChatStore } from '../stores/chat-store'
import { FEATURE_FLAGS } from '../config/feature-flags'
import type { CreateSessionParams, Session } from '../types'

export function useCreateSession() {
  const queryClient = useQueryClient()
  const { pendingSkills, clearPendingSkills, addSession, setCurrentSession } = useChatStore()

  return useMutation({
    mutationFn: async (params?: CreateSessionParams): Promise<Session> => {
      // [预留] 检查是否需要强制选择 skills
      if (FEATURE_FLAGS.requireSkillsBeforeChat) {
        const skills = params?.skills || pendingSkills
        if (!skills || skills.length === 0) {
          throw new Error('请先选择至少一个 Skill')
        }
      }

      const session = await sessionApi.create({
        title: params?.title,
        // [预留] skills: params?.skills || pendingSkills,
      })

      return session
    },
    onSuccess: (session) => {
      addSession(session)
      setCurrentSession(session.id)
      clearPendingSkills()
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
```

---

## 四、后端技术方案

### 4.1 职责边界

| 职责 | nodejs | OpenCode Server |
|------|--------------|-----------------|
| 用户认证 | ✅ | ❌ |
| RBAC 权限控制 | ✅ | ❌ |
| 用户数据持久化 | ✅ | ❌ |
| OpenCode 实例管理 | ✅ | ❌ |
| AI 会话逻辑 | ❌ | ✅ |
| 消息处理 | ❌ | ✅ |
| 工具调用 | ❌ | ✅ |

### 4.2 API 设计

#### 4.2.1 认证相关

| 接口 | 方法 | 描述 | 请求 | 响应 |
|------|------|------|------|------|
| `/api/auth/login` | POST | 用户登录 | `{ email, password }` | `{ user, token, opencode }` |
| `/api/auth/logout` | POST | 用户登出 | - | `{ success }` |
| `/api/auth/me` | GET | 获取当前用户 | - | `{ user }` |

#### 4.2.2 OpenCode 管理

| 接口 | 方法 | 描述 | 请求 | 响应 |
|------|------|------|------|------|
| `/api/opencode/connection` | GET | 获取连接信息 | - | `{ opencode, status }` |
| `/api/opencode/start` | POST | 启动实例 | - | `{ opencode, status }` |
| `/api/opencode/stop` | POST | 停止实例 | - | `{ success }` |
| `/api/opencode/health` | GET | 健康检查 | - | `{ healthy, version }` |

#### 4.2.3 会话持久化 (可选)

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/sessions` | GET | 获取用户会话列表 (持久化) |
| `/api/sessions` | POST | 保存会话 |
| `/api/sessions/:id` | DELETE | 删除会话 |

### 4.3 数据模型

```typescript
// User
interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

// OpenCodeInstance (内部管理)
interface OpenCodeInstance {
  userId: string
  host: string
  port: number
  pid: number
  status: 'running' | 'stopped' | 'error'
  startedAt: Date
}

// UserSession (持久化, 可选)
interface UserSession {
  id: string
  userId: string
  openCodeSessionId: string  // 关联 OpenCode 的 session ID
  title: string
  createdAt: Date
  updatedAt: Date
}
```

### 4.4 OpenCode 实例管理逻辑

```
用户登录
    │
    ▼
检查是否已有运行中的 OpenCode 实例
    │
    ├─ 有 → 返回现有实例信息
    │
    └─ 无 → 分配端口 → 启动 opencode serve
              │
              ▼
         等待服务就绪 (轮询 /global/health)
              │
              ▼
         返回连接信息
```

---

## 五、OpenCode API 对接

### 5.1 常用接口

| 功能 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 健康检查 | `/global/health` | GET | `{ healthy, version }` |
| 事件流 | `/event` | GET (SSE) | 实时事件推送 |
| 会话列表 | `/session` | GET | 返回 `Session[]` |
| 创建会话 | `/session` | POST | `{ title? }` → `Session` |
| 会话详情 | `/session/:id` | GET | 返回 `Session` |
| 删除会话 | `/session/:id` | DELETE | 返回 `boolean` |
| 消息列表 | `/session/:id/message` | GET | 返回 `Message[]` |
| 发送消息 (异步) | `/session/:id/prompt_async` | POST | 不阻塞，通过 SSE 接收响应 |
| 中止生成 | `/session/:id/abort` | POST | 停止当前生成 |
| 命令列表 | `/command` | GET | 返回 `Command[]` |
| 执行命令 | `/session/:id/command` | POST | `{ command, arguments }` |

### 5.2 消息发送格式

```typescript
// POST /session/:id/prompt_async
interface SendMessageRequest {
  messageID?: string
  model?: string
  agent?: string
  noReply?: boolean
  system?: string
  tools?: string[]
  parts: Array<{
    type: 'text'
    text: string
  }>
}
```

### 5.3 SSE 事件处理

```typescript
// 事件类型 (需根据实际 OpenCode 返回调整)
type EventType = 
  | 'server.connected'
  | 'message.created'
  | 'message.updated'
  | 'message.completed'
  | 'tool.invoked'
  | 'tool.completed'
  | 'session.updated'
```

---

## 七、注意事项

### 7.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| SSE + Basic Auth 不兼容 | EventSource 不支持自定义 headers | 使用 fetch + ReadableStream 或后端代理 |
| 多用户端口冲突 | OpenCode 实例启动失败 | 后端维护端口池，动态分配 |
| 用户登出未清理实例 | 资源泄漏 | 定时清理 + 登出时主动停止 |
| 网络断开重连 | 消息丢失 | 心跳检测 + 自动重连 + 消息补偿 |

### 7.2 扩展性检查清单

- [x] 类型定义预留 `skills` 字段
- [x] Store 预留 `pendingSkills` 状态
- [x] 创建会话预留 skills 参数
- [x] Feature Flag 控制 `requireSkillsBeforeChat`
- [x] Hooks 预留 `useAvailableSkills`、`useMcpServers`
- [x] UI 组件预留扩展插槽

---

## 八、参考资源

- [OpenCode Server 文档](https://opencode.ai/docs/server/)
- [prompt-kit 文档](https://www.prompt-kit.com/docs/introduction)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)
