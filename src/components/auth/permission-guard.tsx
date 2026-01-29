import { type ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth-store'

interface PermissionGuardProps {
  /** 需要的权限 */
  permission: string
  /** 有权限时渲染的内容 */
  children: ReactNode
  /** 无权限时渲染的内容（可选） */
  fallback?: ReactNode
}

/**
 * 权限守卫组件
 * 根据用户权限决定是否渲染子组件
 *
 * @example
 * ```tsx
 * <PermissionGuard permission="user:create">
 *   <Button>创建用户</Button>
 * </PermissionGuard>
 *
 * <PermissionGuard permission="user:delete" fallback={<p>无权限</p>}>
 *   <DeleteButton />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { auth } = useAuthStore()

  // 开发环境：如果未启用认证，默认拥有所有权限
  const requireAuth = import.meta.env.VITE_REQUIRE_AUTH === 'true'
  if (!requireAuth && !auth.user) {
    return <>{children}</>
  }

  const hasPermission = auth.user?.permissions?.includes(permission) ?? false

  if (hasPermission) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
