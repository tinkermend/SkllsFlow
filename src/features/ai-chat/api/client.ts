import axios, { type AxiosInstance } from 'axios'
import type { OpenCodeConnection } from '../types'

/**
 * OpenCode 客户端配置常量
 */
const OPENCODE_CONFIG = {
  /** 默认协议 */
  protocol: 'http',
  /** 请求超时时间（毫秒） */
  timeout: 30000,
  /** 默认用户名 */
  defaultUsername: 'opencode',
} as const

let openCodeClient: AxiosInstance | null = null

export function initOpenCodeClient(
  connection: OpenCodeConnection
): AxiosInstance {
  const { host, port, username, password } = connection

  openCodeClient = axios.create({
    baseURL: `${OPENCODE_CONFIG.protocol}://${host}:${port}`,
    timeout: OPENCODE_CONFIG.timeout,
    ...(password && {
      auth: {
        username: username || OPENCODE_CONFIG.defaultUsername,
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

export function getBaseUrl(connection: OpenCodeConnection): string {
  return `${OPENCODE_CONFIG.protocol}://${connection.host}:${connection.port}`
}
