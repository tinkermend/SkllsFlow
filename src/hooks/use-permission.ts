import { useAbility } from '@/context/ability-context'
import { type Actions, type Subjects } from '@/lib/ability'

/**
 * 权限检查 Hook
 * 用于在组件中检查用户是否具有特定权限
 *
 * @example
 * ```tsx
 * function UserList() {
 *   const { can, cannot } = usePermission()
 *
 *   return (
 *     <div>
 *       {can('create', 'User') && <Button>创建用户</Button>}
 *       {cannot('delete', 'User') && <p>无删除权限</p>}
 *     </div>
 *   )
 * }
 * ```
 */
export function usePermission() {
  const ability = useAbility()

  /**
   * 检查是否有权限执行某个操作
   */
  const can = (action: Actions, subject: Subjects): boolean => {
    return ability.can(action, subject)
  }

  /**
   * 检查是否没有权限执行某个操作
   */
  const cannot = (action: Actions, subject: Subjects): boolean => {
    return ability.cannot(action, subject)
  }

  return { can, cannot }
}
