// ============ OpenCode 连接 ============
export interface OpenCodeConnection {
  host: string
  port: number
  password?: string
  username?: string
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

// ============ 会话 ============
export interface Session {
  id: string
  slug: string
  title: string
  version: string
  projectID: string
  directory: string
  parentID?: string
  time: {
    created: number
    updated: number
  }
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
  time: {
    created: number
  }
  agent?: string
  model?: {
    providerID: string
    modelID: string
  }
}

export type Part =
  | TextPart
  | ToolInvocationPart
  | ToolResultPart
  | FilePart
  | ReasoningPart

export interface TextPart {
  type: 'text'
  id?: string
  sessionID?: string
  messageID?: string
  text: string
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

export interface ReasoningPart {
  type: 'reasoning'
  id: string
  sessionID: string
  messageID: string
  text: string
  metadata?: Record<string, any>
  time: {
    start: number
    end?: number
  }
}

// ============ 发送消息请求 ============
export interface SendMessageRequest {
  messageID?: string
  model?: {
    modelID: string
    providerID: string
  }
  agent?: string
  noReply?: boolean
  system?: string
  tools?: string[]
  parts: Array<{
    id?: string
    type: 'text'
    text: string
  }>
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

export interface ExecuteCommandRequest {
  command: string
  arguments?: Record<string, unknown>
}

// ============ SSE 事件 ============
export type EventType =
  | 'server.connected'
  | 'server.heartbeat'
  | 'message.created'
  | 'message.updated'
  | 'message.completed'
  | 'message.part.updated'
  | 'tool.invoked'
  | 'tool.completed'
  | 'session.updated'
  | 'session.deleted'
  | 'session.status'
  | 'session.idle'
  | 'error'

export interface SSEEvent {
  type: EventType
  properties?: {
    sessionID?: string
    messageID?: string
    info?: MessageInfo | Message | Session // 支持完整 Message 类型
    part?: Part & { sessionID?: string; messageID?: string }
    delta?: string // 增量文本，用于流式输出
    message?: Message
    status?: { type: string }
    [key: string]: unknown
  }
}

export interface MessagePartEvent {
  type: 'message.part.updated'
  sessionID: string
  messageID: string
  partIndex: number
  part: Part
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

// ============ API 响应 ============
export interface OpenCodeConnectionResponse {
  opencode: {
    host: string
    port: number
    password?: string
    username?: string
  }
  status: 'ready' | 'starting' | 'error'
  error?: string
}

export interface HealthResponse {
  healthy: boolean
  version?: string
}
