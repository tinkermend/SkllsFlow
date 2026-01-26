import { spawn, type ChildProcess } from 'child_process'
import net from 'net'
import type { OpenCodeInstance, OpenCodeConnectionResponse } from '../types'

// Mock 模式：设置 MOCK_OPENCODE=true 时不启动真实进程
const MOCK_MODE = process.env.MOCK_OPENCODE === 'true'

// 外部 opencode 实例配置（用户已手动启动的实例）
const EXTERNAL_OPENCODE_HOST = process.env.OPENCODE_HOST || 'localhost'
const EXTERNAL_OPENCODE_PORT = process.env.OPENCODE_PORT
  ? parseInt(process.env.OPENCODE_PORT)
  : null

// 存储用户的 OpenCode 实例
const instances = new Map<string, OpenCodeInstance>()

// 端口池管理
let nextPort = 4096
const MAX_PORT = 6000

function getNextPort(): number {
  const port = nextPort
  nextPort = nextPort >= MAX_PORT ? 4096 : nextPort + 1
  return port
}

// 检查端口是否可用
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close()
      resolve(true)
    })
    server.listen(port)
  })
}

// 获取可用端口
async function findAvailablePort(): Promise<number> {
  let attempts = 0
  while (attempts < 100) {
    const port = getNextPort()
    if (await isPortAvailable(port)) {
      return port
    }
    attempts++
  }
  throw new Error('No available ports')
}

// 健康检查
async function checkHealth(host: string, port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://${host}:${port}/global/health`, {
      signal: AbortSignal.timeout(5000),
    })
    const data = await response.json()
    return data.healthy === true
  } catch {
    return false
  }
}

// 等待服务就绪
async function waitForReady(
  host: string,
  port: number,
  maxAttempts = 30
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkHealth(host, port)) {
      return true
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return false
}

export const openCodeService = {
  /**
   * 获取用户的 OpenCode 连接信息
   */
  async getConnection(userId: string): Promise<OpenCodeConnectionResponse> {
    const instance = instances.get(userId)

    if (!instance) {
      return {
        opencode: { host: 'localhost', port: 0 },
        status: 'error',
        error: 'No OpenCode instance found. Please start one first.',
      }
    }

    if (instance.status === 'running') {
      const isHealthy = await checkHealth(instance.host, instance.port)
      if (isHealthy) {
        return {
          opencode: {
            host: instance.host,
            port: instance.port,
          },
          status: 'ready',
        }
      } else {
        instance.status = 'error'
        return {
          opencode: { host: instance.host, port: instance.port },
          status: 'error',
          error: 'OpenCode instance is not responding',
        }
      }
    }

    return {
      opencode: { host: instance.host, port: instance.port },
      status: instance.status === 'error' ? 'error' : 'starting',
      error: instance.status === 'error' ? 'Instance failed to start' : undefined,
    }
  },

  /**
   * 启动用户的 OpenCode 实例
   */
  async startInstance(userId: string): Promise<OpenCodeConnectionResponse> {
    // 如果配置了外部 opencode 实例，直接使用
    if (EXTERNAL_OPENCODE_PORT) {
      const instance: OpenCodeInstance = {
        userId,
        host: EXTERNAL_OPENCODE_HOST,
        port: EXTERNAL_OPENCODE_PORT,
        pid: 0,
        status: 'running',
        startedAt: new Date(),
      }
      instances.set(userId, instance)
      return {
        opencode: { host: EXTERNAL_OPENCODE_HOST, port: EXTERNAL_OPENCODE_PORT },
        status: 'ready',
      }
    }

    // Mock 模式：返回模拟连接
    if (MOCK_MODE) {
      const mockInstance: OpenCodeInstance = {
        userId,
        host: 'localhost',
        port: 4096,
        pid: 0,
        status: 'running',
        startedAt: new Date(),
      }
      instances.set(userId, mockInstance)
      return {
        opencode: { host: 'localhost', port: 4096 },
        status: 'ready',
      }
    }

    // 检查是否已有运行中的实例
    const existing = instances.get(userId)
    if (existing && existing.status === 'running') {
      const isHealthy = await checkHealth(existing.host, existing.port)
      if (isHealthy) {
        return {
          opencode: {
            host: existing.host,
            port: existing.port,
          },
          status: 'ready',
        }
      }
    }

    try {
      const port = await findAvailablePort()
      const host = 'localhost'

      // 创建实例记录
      const instance: OpenCodeInstance = {
        userId,
        host,
        port,
        pid: 0,
        status: 'running',
        startedAt: new Date(),
      }

      instances.set(userId, instance)

      // 启动 opencode serve 进程
      // 注意：实际项目中需要根据实际的 opencode 命令行工具来调整
      const process = spawn('opencode', ['serve', '--port', port.toString()], {
        detached: true,
        stdio: 'ignore',
      })

      if (process.pid) {
        instance.pid = process.pid
        process.unref()
      }

      // 等待服务就绪
      const isReady = await waitForReady(host, port)

      if (isReady) {
        return {
          opencode: { host, port },
          status: 'ready',
        }
      } else {
        instance.status = 'error'
        return {
          opencode: { host, port },
          status: 'error',
          error: 'Timeout waiting for OpenCode to start',
        }
      }
    } catch (error) {
      return {
        opencode: { host: 'localhost', port: 0 },
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },

  /**
   * 停止用户的 OpenCode 实例
   */
  async stopInstance(userId: string): Promise<boolean> {
    const instance = instances.get(userId)
    if (!instance) {
      return true
    }

    try {
      if (instance.pid > 0) {
        process.kill(instance.pid)
      }
      instances.delete(userId)
      return true
    } catch {
      instances.delete(userId)
      return false
    }
  },

  /**
   * 检查实例健康状态
   */
  async checkInstanceHealth(
    userId: string
  ): Promise<{ healthy: boolean; version?: string }> {
    const instance = instances.get(userId)
    if (!instance || instance.status !== 'running') {
      return { healthy: false }
    }

    try {
      const response = await fetch(
        `http://${instance.host}:${instance.port}/global/health`,
        { signal: AbortSignal.timeout(5000) }
      )
      const data = await response.json()
      return {
        healthy: data.healthy === true,
        version: data.version,
      }
    } catch {
      return { healthy: false }
    }
  },

  /**
   * 清理所有实例 (用于服务关闭时)
   */
  async cleanupAll(): Promise<void> {
    for (const [userId] of instances) {
      await this.stopInstance(userId)
    }
  },
}
