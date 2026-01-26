import axios, { type AxiosInstance } from 'axios'
import type { OpenCodeConnection } from '../types'

let openCodeClient: AxiosInstance | null = null

export function initOpenCodeClient(
  connection: OpenCodeConnection
): AxiosInstance {
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

export function getBaseUrl(connection: OpenCodeConnection): string {
  return `http://${connection.host}:${connection.port}`
}
