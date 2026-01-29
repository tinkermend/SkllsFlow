import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'thisisjustarandomstring'
const USER_INFO = 'user_info'

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

  // 从 cookie 中恢复用户信息
  const userCookie = getCookie(USER_INFO)
  const initUser = userCookie ? JSON.parse(userCookie) : null

  return {
    auth: {
      user: initUser,
      setUser: (user) =>
        set((state) => {
          // 持久化用户信息到 cookie
          if (user) {
            setCookie(USER_INFO, JSON.stringify(user))
          } else {
            removeCookie(USER_INFO)
          }
          return { ...state, auth: { ...state.auth, user } }
        }),
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
          removeCookie(USER_INFO)
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
