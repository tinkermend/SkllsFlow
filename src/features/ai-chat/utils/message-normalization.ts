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

export function normalizeMessages(values: unknown): Message[] {
  if (!Array.isArray(values)) return []
  return values.map(normalizeMessage).filter((message): message is Message => message !== null)
}
