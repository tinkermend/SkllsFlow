import { describe, expect, it } from 'vitest'
import { getSessionErrorMessage } from './session-error'

describe('getSessionErrorMessage', () => {
  it('uses error.data.message for opencode unknown errors', () => {
    expect(
      getSessionErrorMessage({
        name: 'UnknownError',
        data: { message: 'Agent "sisyphus" not found' },
      })
    ).toBe('Agent "sisyphus" not found')
  })

  it('prefers error.message when present', () => {
    expect(getSessionErrorMessage({ message: 'provider auth failed' })).toBe(
      'provider auth failed'
    )
  })

  it('falls back to error.name then default text', () => {
    expect(getSessionErrorMessage({ name: 'MessageAbortedError' })).toBe(
      'MessageAbortedError'
    )
    expect(getSessionErrorMessage({})).toBe('会话处理失败')
  })
})
