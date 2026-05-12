/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCK: string
  readonly VITE_AI_CHAT_AGENT?: string
  readonly VITE_AI_CHAT_MODEL_PROVIDER_ID?: string
  readonly VITE_AI_CHAT_MODEL_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
