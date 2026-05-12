import { describe, expect, it } from 'vitest'
import { createLocalUserMessage } from './use-chat'

describe('createLocalUserMessage', () => {
  it('creates a user message with a local id', () => {
    const message = createLocalUserMessage('ses_1', 'hello')

    expect(message.info.role).toBe('user')
    expect(message.info.sessionID).toBe('ses_1')
    expect(message.info.id).toMatch(/^msg_/)
    expect(message.parts).toHaveLength(1)
  })
})
