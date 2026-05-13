import { format } from 'date-fns'
import type { ChatServer } from '../types'

export type HealthStatus = NonNullable<ChatServer['healthStatus']>

export const HEALTH_INDICATORS: Record<HealthStatus, { label: string; className: string }> = {
  healthy: { label: '运行正常', className: 'bg-green-500 ring-green-500/70' },
  unhealthy: { label: '运行异常', className: 'bg-red-500 ring-red-500/70' },
  unknown: { label: '状态未知', className: 'bg-stone-400 ring-stone-400/60' },
}

export const formatDateTime = (value?: string): string => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }
  return format(date, 'yyyy-MM-dd HH:mm')
}

export const buildHealthTooltip = (server: ChatServer): string => {
  const status: HealthStatus = server.healthStatus ?? 'unknown'
  const base = HEALTH_INDICATORS[status].label
  const parts = [base]
  if (server.healthVersion) {
    parts.push(`版本 ${server.healthVersion}`)
  }
  if (server.healthCheckedAt) {
    const checkedAt = new Date(server.healthCheckedAt)
    if (!Number.isNaN(checkedAt.getTime())) {
      parts.push(format(checkedAt, 'HH:mm:ss'))
    }
  }
  return parts.join(' · ')
}
