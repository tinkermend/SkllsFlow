import { describe, expect, it } from 'vitest'
import { mergeMessageList, normalizeMessages } from './message-normalization'

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

  it('merges duplicate message ids instead of rendering repeated user prompts', () => {
    const localUserMessage = {
      info: {
        id: 'msg_user_1',
        sessionID: 'ses_1',
        role: 'user' as const,
        time: { created: 1 },
      },
      parts: [{ type: 'text' as const, text: '你是什么模型' }],
    }
    const serverUserMessage = {
      info: {
        id: 'msg_user_1',
        sessionID: 'ses_1',
        role: 'user' as const,
        time: { created: 2 },
      },
      parts: [{ type: 'text' as const, text: '你是什么模型' }],
    }

    const messages = mergeMessageList([localUserMessage], [serverUserMessage])

    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      info: {
        id: 'msg_user_1',
        sessionID: 'ses_1',
        role: 'user',
        time: { created: 2 },
      },
      parts: [{ type: 'text', text: '你是什么模型' }],
    })
  })

  it('deduplicates repeated text parts inside one user message', () => {
    const messages = normalizeMessages([
      {
        info: {
          id: 'msg_user_2',
          sessionID: 'ses_1',
          role: 'user' as const,
          time: { created: 1 },
        },
        parts: [
          { type: 'text' as const, text: '你能做什么?' },
          { id: 'part_1', type: 'text' as const, text: '你能做什么?' },
        ],
      },
    ])

    expect(messages).toHaveLength(1)
    expect(messages[0].parts).toHaveLength(1)
    expect(messages[0].parts[0]).toMatchObject({
      type: 'text',
      text: '你能做什么?',
    })
  })
})
