import type { Command, ExecuteCommandRequest } from '../types'
import { getOpenCodeClient } from './client'

export const commandApi = {
  /**
   * 获取所有可用命令
   */
  getAll: async (): Promise<Command[]> => {
    const client = getOpenCodeClient()
    const response = await client.get<Command[]>('/command')
    return response.data
  },

  /**
   * 执行命令
   */
  execute: async (
    sessionId: string,
    request: ExecuteCommandRequest
  ): Promise<void> => {
    const client = getOpenCodeClient()
    await client.post(`/session/${sessionId}/command`, request)
  },
}
