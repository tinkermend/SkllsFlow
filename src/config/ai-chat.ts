import type { SendMessageRequest } from '@/features/ai-chat/types'

type AIChatEnv = Partial<
  Record<
    | 'VITE_AI_CHAT_AGENT'
    | 'VITE_AI_CHAT_MODEL_PROVIDER_ID'
    | 'VITE_AI_CHAT_MODEL_ID',
    string
  >
>

export function resolveAIChatPromptDefaults(
  env: AIChatEnv
): Pick<SendMessageRequest, 'agent' | 'model'> | Record<string, never> {
  const agent = env.VITE_AI_CHAT_AGENT?.trim()
  const providerID = env.VITE_AI_CHAT_MODEL_PROVIDER_ID?.trim()
  const modelID = env.VITE_AI_CHAT_MODEL_ID?.trim()

  const defaults: Pick<SendMessageRequest, 'agent' | 'model'> = {}

  if (agent) {
    defaults.agent = agent
  }

  if (providerID && modelID) {
    defaults.model = {
      providerID,
      modelID,
    }
  }

  return defaults
}

export const AI_CHAT_PROMPT_DEFAULTS = resolveAIChatPromptDefaults(
  import.meta.env
)
