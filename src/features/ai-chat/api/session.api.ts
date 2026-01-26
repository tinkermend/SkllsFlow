import type { Session, CreateSessionParams } from '../types'
import { getOpenCodeClient } from './client'

export const sessionApi = {
  /**
   * 获取所有会话
   */
  getAll: async (): Promise<Session[]> => {
    const client = getOpenCodeClient()
    const response = await client.get<Session[]>('/session')
    return response.data
  },

  /**
   * 获取单个会话详情
   */
  getById: async (id: string): Promise<Session> => {
    const client = getOpenCodeClient()
    const response = await client.get<Session>(`/session/${id}`)
    return response.data
  },

  /**
   * 创建新会话
   */
  create: async (params?: CreateSessionParams): Promise<Session> => {
    const client = getOpenCodeClient()
    const response = await client.post<Session>('/session', params || {})
    return response.data
  },

  /**
   * 删除会话
   */
  delete: async (id: string): Promise<boolean> => {
    const client = getOpenCodeClient()
    const response = await client.delete<boolean>(`/session/${id}`)
    return response.data
  },

  /**
   * 更新会话（修改标题等）
   */
  update: async (
    id: string,
    params: { title?: string }
  ): Promise<Session> => {
    const client = getOpenCodeClient()
    const response = await client.patch<Session>(`/session/${id}`, params)
    return response.data
  },
}
