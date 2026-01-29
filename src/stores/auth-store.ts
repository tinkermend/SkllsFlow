import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'thisisjustarandomstring'

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
  const cookieState = getCookie(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''
  return {
    auth: {
      user: null,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: initToken,
      accessTokenExpiresAt: 0,
      setAccessToken: (accessToken, expiresIn) =>
        set((state) => {
          setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
          return {
            ...state,
            auth: {
              ...state.auth,
              accessToken,
              accessTokenExpiresAt: Date.now() + expiresIn * 1000,
            },
          }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
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
