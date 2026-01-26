export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface OpenCodeInstance {
  userId: string
  host: string
  port: number
  pid: number
  status: 'running' | 'stopped' | 'error'
  startedAt: Date
}

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
