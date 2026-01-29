import { ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth-store'

interface RoleGuardProps {
  /** 允许访问的角色列表 */
  allowedRoles: string[]
  /** 有权限时渲染的内容 */
  children: ReactNode
  /** 无权限时渲染的内容（可选） */
  fallback?: ReactNode
}

/**
 * 角色守卫组件
 * 根据用户角色决定是否渲染子组件
 *
 * @example
 * ```tsx
 * <RoleGuard allowedRoles={['admin', 'manager']}>
 *   <AdminPanel />
 * </RoleGuard>
 *
 * <RoleGuard allowedRoles={['admin']} fallback={<p>仅管理员可访问</p>}>
 *   <DangerZone />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { auth } = useAuthStore()

  const hasRole = auth.user?.roles.some((role) =>
    allowedRoles.includes(role)
  )

  if (hasRole) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
