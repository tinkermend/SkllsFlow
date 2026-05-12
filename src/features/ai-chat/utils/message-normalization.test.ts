import { describe, expect, it } from 'vitest'
import { normalizeMessages } from './message-normalization'

describe('normalizeMessages', () => {
  it('drops invalid messages and keeps valid ones', () => {
    const validMessage = {
      info: {
        id: 'msg_1',
        sessionID: 'ses_1',
        role: 'assistant' as const,
        time: { created: 1 },
      },
      parts: [{ type: 'text' as const, text: 'hello' }],
    }

    const messages = normalizeMessages([
      validMessage,
      null,
      undefined,
      { info: null, parts: [] },
      { info: { id: '', sessionID: 'ses_1', role: 'assistant' as const, time: { created: 1 } }, parts: [] },
    ])

    expect(messages).toHaveLength(1)
    expect(messages[0].info.id).toBe('msg_1')
    expect(messages[0].parts).toHaveLength(1)
  })

  it('defaults missing parts to an empty array', () => {
    const messages = normalizeMessages([
      {
        info: {
          id: 'msg_2',
          sessionID: 'ses_1',
          role: 'user' as const,
          time: { created: 2 },
        },
      },
    ])

    expect(messages).toHaveLength(1)
    expect(messages[0].parts).toEqual([])
  })
})
