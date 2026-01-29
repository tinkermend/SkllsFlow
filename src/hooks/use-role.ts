import { useAuthStore } from '@/stores/auth-store'

/**
 * 角色检查 Hook
 * 用于在组件中检查用户是否具有特定角色
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { hasRole, hasAnyRole, hasAllRoles, roles } = useRole()
 *
 *   if (!hasRole('admin')) {
 *     return <p>仅管理员可访问</p>
 *   }
 *
 *   return (
 *     <div>
 *       <h1>管理面板</h1>
 *       {hasAnyRole(['admin', 'manager']) && <AdvancedSettings />}
 *       <p>当前角色: {roles.join(', ')}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useRole() {
  const { auth } = useAuthStore()

  const roles = auth.user?.roles || []

  /**
   * 检查是否具有指定角色
   */
  const hasRole = (role: string): boolean => {
    return roles.includes(role)
  }

  /**
   * 检查是否具有任意一个指定角色
   */
  const hasAnyRole = (requiredRoles: string[]): boolean => {
    return requiredRoles.some((role) => roles.includes(role))
  }

  /**
   * 检查是否具有所有指定角色
   */
  const hasAllRoles = (requiredRoles: string[]): boolean => {
    return requiredRoles.every((role) => roles.includes(role))
  }

  return {
    roles,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  }
}
