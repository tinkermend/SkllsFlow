import type { Message, SendMessageRequest } from '../types'
import { getOpenCodeClient } from './client'

export const messageApi = {
  /**
   * 获取指定会话的所有消息
   */
  getBySessionId: async (sessionId: string): Promise<Message[]> => {
    const client = getOpenCodeClient()
    const response = await client.get<Message[]>(
      `/session/${sessionId}/message`
    )
    return response.data
  },

  /**
   * 发送消息 (session.prompt)
   * 这是主要的消息发送 API，支持传入 messageID 用于乐观更新
   * API 会立即返回，响应通过 SSE 事件流推送
   */
  prompt: async (
    sessionId: string,
    request: SendMessageRequest
  ): Promise<Message> => {
    const client = getOpenCodeClient()
    const response = await client.post<Message>(
      `/session/${sessionId}/message`,
      request
    )
    return response.data
  },

  /**
   * 同步发送消息 (阻塞等待 AI 响应)
   * @deprecated 推荐使用 prompt + SSE 事件流
   */
  send: async (
    sessionId: string,
    request: SendMessageRequest
  ): Promise<Message[]> => {
    const client = getOpenCodeClient()
    // 设置较长超时，AI 响应可能需要时间
    const response = await client.post<Message[]>(
      `/session/${sessionId}/message`,
      request,
      { timeout: 120000 }
    )
    return response.data
  },

  /**
   * 异步发送消息 (不阻塞，需要轮询获取响应)
   * @deprecated 推荐使用 prompt + SSE 事件流
   */
  sendAsync: async (
    sessionId: string,
    request: SendMessageRequest
  ): Promise<void> => {
    const client = getOpenCodeClient()
    await client.post(`/session/${sessionId}/prompt_async`, request)
  },

  /**
   * 中止当前生成
   */
  abort: async (sessionId: string): Promise<void> => {
    const client = getOpenCodeClient()
    await client.post(`/session/${sessionId}/abort`)
  },
}
