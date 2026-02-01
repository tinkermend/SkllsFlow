import { apiClient } from '@/lib/api-client'
import type { OpenCodeConnectionResponse } from '../types'

/**
 * 后端 API
 * 使用统一的 apiClient，自动处理认证 token
 */
export const backendApi = {
  /**
   * 获取 OpenCode 连接信息
   */
  getOpenCodeConnection: async (): Promise<OpenCodeConnectionResponse> => {
    const response = await apiClient.get<OpenCodeConnectionResponse>(
      '/opencode/connection'
    )
    return response.data
  },

  /**
   * 启动 OpenCode 实例
   */
  startOpenCode: async (): Promise<OpenCodeConnectionResponse> => {
    const response =
      await apiClient.post<OpenCodeConnectionResponse>('/opencode/start')
    return response.data
  },

  /**
   * 停止 OpenCode 实例
   */
  stopOpenCode: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>(
      '/opencode/stop'
    )
    return response.data
  },

  /**
   * 健康检查
   */
  checkHealth: async (): Promise<{ healthy: boolean; version?: string }> => {
    const response = await apiClient.get<{
      healthy: boolean
      version?: string
    }>('/opencode/health')
    return response.data
  },

  /**
   * 准备会话目录（完整流程：获取基础目录并创建用户会话目录）
   */
  prepareSessionDirectory: async (accountNo: string): Promise<{
    directory: string
    directoryName: string
  }> => {
    const response = await apiClient.post<{
      directory: string
      directoryName: string
    }>('/directories/prepare', { accountNo })
    return response.data
  },
}

// 导出 apiClient 作为 backendClient（保持向后兼容）
export { apiClient as backendClient }
