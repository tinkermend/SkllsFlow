import { ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { useAbility } from '@/context/ability-context'
import { Actions, Subjects } from '@/lib/ability'

interface ProtectedRouteProps {
  /** 子组件 */
  children: ReactNode
  /** 需要的角色（可选） */
  requiredRoles?: string[]
  /** 需要的权限（可选） */
  requiredPermission?: {
    action: Actions
    subject: Subjects
  }
  /** 未授权时重定向的路径 */
  redirectTo?: string
}

/**
 * 路由级权限保护组件
 * 支持基于角色和权限的访问控制
 *
 * @example
 * ```tsx
 * // 仅管理员可访问
 * <ProtectedRoute requiredRoles={['admin']}>
 *   <AdminPage />
 * </ProtectedRoute>
 *
 * // 需要特定权限
 * <ProtectedRoute requiredPermission={{ action: 'delete', subject: 'User' }}>
 *   <UserManagementPage />
 * </ProtectedRoute>
 *
 * // 组合使用
 * <ProtectedRoute
 *   requiredRoles={['admin', 'manager']}
 *   requiredPermission={{ action: 'read', subject: 'Role' }}
 *   redirectTo="/unauthorized"
 * >
 *   <RoleManagementPage />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermission,
  redirectTo = '/unauthorized',
}: ProtectedRouteProps) {
  const { auth } = useAuthStore()
  const ability = useAbility()

  // 检查用户是否已登录
  if (!auth.user) {
    return <Navigate to="/sign-in" />
  }

  // 检查角色权限
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = auth.user.roles.some((role) =>
      requiredRoles.includes(role)
    )
    if (!hasRole) {
      return <Navigate to={redirectTo} />
    }
  }

  // 检查操作权限
  if (requiredPermission) {
    const { action, subject } = requiredPermission
    if (!ability.can(action, subject)) {
      return <Navigate to={redirectTo} />
    }
  }

  return <>{children}</>
}
