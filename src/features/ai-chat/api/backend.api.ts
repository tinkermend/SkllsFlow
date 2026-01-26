import axios from 'axios'
import type { OpenCodeConnectionResponse } from '../types'

// 后端 API 基础 URL - 在实际项目中应该从环境变量获取
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || '/api'

const backendClient = axios.create({
  baseURL: BACKEND_API_URL,
  timeout: 30000,
  withCredentials: true,
})

export const backendApi = {
  /**
   * 获取 OpenCode 连接信息
   */
  getOpenCodeConnection: async (): Promise<OpenCodeConnectionResponse> => {
    const response = await backendClient.get<OpenCodeConnectionResponse>(
      '/opencode/connection'
    )
    return response.data
  },

  /**
   * 启动 OpenCode 实例
   */
  startOpenCode: async (): Promise<OpenCodeConnectionResponse> => {
    const response =
      await backendClient.post<OpenCodeConnectionResponse>('/opencode/start')
    return response.data
  },

  /**
   * 停止 OpenCode 实例
   */
  stopOpenCode: async (): Promise<{ success: boolean }> => {
    const response = await backendClient.post<{ success: boolean }>(
      '/opencode/stop'
    )
    return response.data
  },

  /**
   * 健康检查
   */
  checkHealth: async (): Promise<{ healthy: boolean; version?: string }> => {
    const response = await backendClient.get<{
      healthy: boolean
      version?: string
    }>('/opencode/health')
    return response.data
  },
}

export { backendClient }
