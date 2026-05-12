// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { createLocalUserMessage, createPromptRequest } from './use-chat'

describe('createLocalUserMessage', () => {
  it('creates a user message with a local id', () => {
    const message = createLocalUserMessage('ses_1', 'hello')

    expect(message.info.role).toBe('user')
    expect(message.info.sessionID).toBe('ses_1')
    expect(message.info.id).toMatch(/^msg_/)
    expect(message.parts).toHaveLength(1)
  })
})

describe('createPromptRequest', () => {
  it('uses the local optimistic message id to avoid duplicate user messages', () => {
    const message = createLocalUserMessage('ses_1', 'hello')
    const request = createPromptRequest(message, 'hello')

    expect(request).toMatchObject({
      messageID: message.info.id,
      parts: [{ type: 'text', text: 'hello' }],
    })
  })
})
