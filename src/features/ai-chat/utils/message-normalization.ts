import type { Message, MessageInfo } from '../types'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isValidRole = (role: unknown): role is MessageInfo['role'] =>
  role === 'user' || role === 'assistant'

const normalizeInfo = (value: unknown): MessageInfo | null => {
  if (!isRecord(value)) return null

  const { id, sessionID, role, time, agent, model } = value

  if (typeof id !== 'string' || id.trim() === '') return null
  if (typeof sessionID !== 'string' || sessionID.trim() === '') return null
  if (!isValidRole(role)) return null
  if (!isRecord(time) || typeof time.created !== 'number') return null

  return {
    id,
    sessionID,
    role,
    time: { created: time.created },
    ...(typeof agent === 'string' ? { agent } : {}),
    ...(isRecord(model) &&
    typeof model.providerID === 'string' &&
    typeof model.modelID === 'string'
      ? {
          model: {
            providerID: model.providerID,
            modelID: model.modelID,
          },
        }
      : {}),
  }
}

export function normalizeMessage(value: unknown): Message | null {
  if (!isRecord(value)) return null

  const info = normalizeInfo(value.info)
  if (!info) return null

  const parts = Array.isArray(value.parts) ? value.parts : []

  return {
    info,
    parts,
  }
}

const getPartKey = (part: Message['parts'][number]): string => {
  const partId = (part as { id?: unknown }).id
  if (typeof partId === 'string' && partId.trim()) {
    return `${part.type}:${partId}`
  }

  return `${part.type}:${JSON.stringify(part)}`
}

export function mergeMessages(previous: Message, next: Message): Message {
  const partsByKey = new Map<string, Message['parts'][number]>()

  for (const part of previous.parts) {
    partsByKey.set(getPartKey(part), part)
  }

  for (const part of next.parts) {
    partsByKey.set(getPartKey(part), part)
  }

  return {
    info: {
      ...previous.info,
      ...next.info,
      time: {
        ...previous.info.time,
        ...next.info.time,
      },
    },
    parts: Array.from(partsByKey.values()),
  }
}

export function mergeMessageList(...lists: unknown[]): Message[] {
  const messagesById = new Map<string, Message>()

  for (const list of lists) {
    if (!Array.isArray(list)) continue

    for (const value of list) {
      const message = normalizeMessage(value)
      if (!message) continue

      const existing = messagesById.get(message.info.id)
      messagesById.set(
        message.info.id,
        existing ? mergeMessages(existing, message) : message
      )
    }
  }

  return Array.from(messagesById.values())
}

export function normalizeMessages(values: unknown): Message[] {
  return mergeMessageList(values)
}
