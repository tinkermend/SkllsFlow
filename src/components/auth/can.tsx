import { ReactNode } from 'react'
import { useAbility } from '@/context/ability-context'
import { Actions, Subjects } from '@/lib/ability'

interface CanProps {
  /** 操作类型 */
  action: Actions
  /** 资源类型 */
  subject: Subjects
  /** 有权限时渲染的内容 */
  children: ReactNode
  /** 无权限时渲染的内容（可选） */
  fallback?: ReactNode
}

/**
 * 权限控制组件
 * 根据用户权限决定是否渲染子组件
 *
 * @example
 * ```tsx
 * <Can action="create" subject="User">
 *   <Button>创建用户</Button>
 * </Can>
 *
 * <Can action="delete" subject="Role" fallback={<p>无权限</p>}>
 *   <Button variant="destructive">删除角色</Button>
 * </Can>
 * ```
 */
export function Can({ action, subject, children, fallback = null }: CanProps) {
  const ability = useAbility()

  if (ability.can(action, subject)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
