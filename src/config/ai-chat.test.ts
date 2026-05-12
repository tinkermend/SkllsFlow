import { describe, expect, it } from 'vitest'
import { resolveAIChatPromptDefaults } from './ai-chat'

describe('resolveAIChatPromptDefaults', () => {
  it('returns empty overrides when chat prompt config is missing', () => {
    expect(resolveAIChatPromptDefaults({})).toEqual({})
  })

  it('returns agent and model when config is complete', () => {
    expect(
      resolveAIChatPromptDefaults({
        VITE_AI_CHAT_AGENT: 'Sisyphus - Ultraworker',
        VITE_AI_CHAT_MODEL_PROVIDER_ID: 'opencode-go',
        VITE_AI_CHAT_MODEL_ID: 'glm-5',
      })
    ).toEqual({
      agent: 'Sisyphus - Ultraworker',
      model: {
        providerID: 'opencode-go',
        modelID: 'glm-5',
      },
    })
  })

  it('returns model override without agent when model config is complete', () => {
    expect(
      resolveAIChatPromptDefaults({
        VITE_AI_CHAT_MODEL_PROVIDER_ID: 'opencode-go',
        VITE_AI_CHAT_MODEL_ID: 'glm-5',
      })
    ).toEqual({
      model: {
        providerID: 'opencode-go',
        modelID: 'glm-5',
      },
    })
  })

  it('returns agent override without model when agent config is set', () => {
    expect(
      resolveAIChatPromptDefaults({
        VITE_AI_CHAT_AGENT: 'custom-agent',
      })
    ).toEqual({
      agent: 'custom-agent',
    })
  })

  it('ignores incomplete model config', () => {
    expect(
      resolveAIChatPromptDefaults({
        VITE_AI_CHAT_MODEL_PROVIDER_ID: 'opencode-go',
      })
    ).toEqual({})
  })
})
