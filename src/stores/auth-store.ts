import { create } from 'zustand'

const ACCESS_TOKEN_KEY = 'skillsflow:access_token'
const ACCESS_TOKEN_EXP_KEY = 'skillsflow:access_token_exp'
const USER_INFO_KEY = 'skillsflow:user_info'

const isBrowser = () => typeof window !== 'undefined'

const readSessionItem = (key: string): string | null => {
  if (!isBrowser()) return null
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

const writeSessionItem = (key: string, value: string) => {
  if (!isBrowser()) return
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // no-op: sessionStorage may be unavailable (e.g., Safari private mode)
  }
}

const removeSessionItem = (key: string) => {
  if (!isBrowser()) return
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

const readStoredUser = (): AuthUser | null => {
  const raw = readSessionItem(USER_INFO_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

const readStoredToken = () => readSessionItem(ACCESS_TOKEN_KEY) ?? ''

const readStoredTokenExpiry = () => {
  const raw = readSessionItem(ACCESS_TOKEN_EXP_KEY)
  if (!raw) return 0
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

interface AuthUser {
  userId: string  // 改为 UUID (对外 API)
  accountNo: string
  email: string
  username: string
  roles: string[]
  permissions: string[]
  exp: number
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    accessTokenExpiresAt: number
    setAccessToken: (accessToken: string, expiresIn: number) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => {
  const initToken = readStoredToken()
  const initUser = readStoredUser()
  const initTokenExpiry = readStoredTokenExpiry()

  return {
    auth: {
      user: initUser,
      setUser: (user) =>
        set((state) => {
          // 持久化用户信息到 sessionStorage
          if (user) {
            writeSessionItem(USER_INFO_KEY, JSON.stringify(user))
          } else {
            removeSessionItem(USER_INFO_KEY)
          }
          return { ...state, auth: { ...state.auth, user } }
        }),
      accessToken: initToken,
      accessTokenExpiresAt: initTokenExpiry,
      setAccessToken: (accessToken, expiresIn) =>
        set((state) => {
          if (accessToken) {
            const expiresAt = Date.now() + expiresIn * 1000
            writeSessionItem(ACCESS_TOKEN_KEY, accessToken)
            writeSessionItem(
              ACCESS_TOKEN_EXP_KEY,
              expiresAt.toString()
            )
            return {
              ...state,
              auth: {
                ...state.auth,
                accessToken,
                accessTokenExpiresAt: expiresAt,
              },
            }
          } else {
            removeSessionItem(ACCESS_TOKEN_KEY)
            removeSessionItem(ACCESS_TOKEN_EXP_KEY)
            return {
              ...state,
              auth: {
                ...state.auth,
                accessToken: '',
                accessTokenExpiresAt: 0,
              },
            }
          }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeSessionItem(ACCESS_TOKEN_KEY)
          removeSessionItem(ACCESS_TOKEN_EXP_KEY)
          return {
            ...state,
            auth: {
              ...state.auth,
              accessToken: '',
              accessTokenExpiresAt: 0,
            },
          }
        }),
      reset: () =>
        set((state) => {
          removeSessionItem(ACCESS_TOKEN_KEY)
          removeSessionItem(ACCESS_TOKEN_EXP_KEY)
          removeSessionItem(USER_INFO_KEY)
          return {
            ...state,
            auth: {
              ...state.auth,
              user: null,
              accessToken: '',
              accessTokenExpiresAt: 0,
            },
          }
        }),
    },
  }
})
