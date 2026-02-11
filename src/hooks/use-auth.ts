import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import apiClient from '@/lib/api-client'
import { toast } from 'sonner'

interface LoginCredentials {
  accountNo: string
  password: string
}

interface LoginResponse {
  user: {
    userId: string  // UUID (对外 API)
    accountNo: string
    email: string
    username: string
    roles: string[]
    permissions: string[]
  }
  accessToken: string
  expiresIn: number
}

/**
 * 认证 Hook
 * 提供登录、登出等认证相关功能
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { login, logout, isAuthenticated } = useAuth()
 *
 *   const handleLogin = async () => {
 *     await login({ accountNo: 'admin', password: '123456' })
 *   }
 *
 *   return (
 *     <div>
 *       {isAuthenticated ? (
 *         <button onClick={logout}>登出</button>
 *       ) : (
 *         <button onClick={handleLogin}>登录</button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useAuth() {
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  /**
   * 用户登录
   */
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiClient.post<LoginResponse>(
        '/auth/login',
        credentials
      )

      const { user, accessToken, expiresIn } = response.data

      // 保存用户信息和 Token
      auth.setUser({
        ...user,
        exp: Date.now() + expiresIn * 1000,
      })
      auth.setAccessToken(accessToken, expiresIn)

      toast.success('登录成功')

      // 跳转到首页或重定向页面
      const redirect = new URLSearchParams(window.location.search).get(
        'redirect'
      )
      navigate({ to: redirect || '/' })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; message?: string } } }
      const message = err.response?.data?.error || err.response?.data?.message || '登录失败，请重试'
      toast.error(message)
      throw error
    }
  }

  /**
   * 用户登出
   */
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // 登出失败也继续重置状态
    } finally {
      auth.reset()
      navigate({ to: '/sign-in' })
      toast.success('已登出')
    }
  }

  /**
   * 检查是否已认证
   */
  const isAuthenticated = !!auth.user && !!auth.accessToken

  /**
   * 检查 Token 是否过期
   */
  const isTokenExpired = () => {
    if (!auth.accessTokenExpiresAt) return true
    return Date.now() >= auth.accessTokenExpiresAt
  }

  return {
    login,
    logout,
    isAuthenticated,
    isTokenExpired,
    user: auth.user,
  }
}
