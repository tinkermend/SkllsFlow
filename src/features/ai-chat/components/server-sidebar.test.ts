import { describe, it, expect } from 'vitest'
import type { ChatServer } from '../types'
import { buildHealthTooltip, formatDateTime } from './server-sidebar-utils'

const createServer = (overrides: Partial<ChatServer> = {}): ChatServer => ({
  id: '1',
  chatId: 'chat-1',
  name: 'Mock',
  chatDir: '/tmp/mock',
  proxyId: 'proxy-1',
  host: '127.0.0.1',
  port: 4000,
  auth: false,
  authPassword: '',
  status: 'active',
  errorMessage: null,
  createdAt: '2026-02-03T09:00:00Z',
  createdBy: 'user-1',
  ...overrides,
})

describe('server sidebar helpers', () => {
  it('formats datetime and falls back when invalid', () => {
    expect(formatDateTime('2026-02-03T09:15:00Z')).toContain('2026')
    expect(formatDateTime('invalid-date')).toBe('--')
    expect(formatDateTime()).toBe('--')
  })

  it('builds tooltip text with version and timestamp info', () => {
    const tooltip = buildHealthTooltip(
      createServer({
        healthStatus: 'healthy',
        healthVersion: '1.1.48',
        healthCheckedAt: '2026-02-03T09:30:15Z',
      })
    )

    expect(tooltip).toContain('运行正常')
    expect(tooltip).toContain('版本 1.1.48')
    expect(tooltip).toMatch(/\d{2}:\d{2}:\d{2}/)
  })

  it('omits version/time when unavailable', () => {
    const tooltip = buildHealthTooltip(
      createServer({
        healthStatus: 'unknown',
        healthVersion: undefined,
        healthCheckedAt: undefined,
      })
    )

    expect(tooltip).toBe('状态未知')
  })
})
