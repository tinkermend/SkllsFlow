import { Ability, AbilityBuilder } from '@casl/ability'

export type Actions =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'install'
  | 'uninstall'
  | 'assign-roles'
  | 'assign-permissions'

export type Subjects =
  | 'User'
  | 'Role'
  | 'Session'
  | 'Skill'
  | 'Mcp'
  | 'Agent'
  | 'ChatServer'
  | 'all'

export type AppAbility = Ability<[Actions, Subjects]>

/**
 * 根据权限代码列表创建 Ability
 */
export function defineAbilityFor(permissions: string[]): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(Ability)

  permissions.forEach((permission) => {
    const [resource, action] = permission.split(':')

    // 权限代码映射到 CASL action
    const actionMap: Record<string, Actions> = {
      view: 'read',
      create: 'create',
      update: 'update',
      delete: 'delete',
      install: 'install',
      uninstall: 'uninstall',
      'assign-roles': 'assign-roles',
      'assign-permissions': 'assign-permissions',
    }

    const caslAction = actionMap[action] || (action as Actions)

    // 将 resource 首字母大写以匹配 Subjects 类型
    // 例如：skill -> Skill, user -> User
    const capitalizedResource = resource.charAt(0).toUpperCase() + resource.slice(1)

    can(caslAction, capitalizedResource as Subjects)
  })

  return build()
}

/**
 * 解析权限代码
 */
export function parsePermission(code: string): {
  resource: string
  action: string
} {
  const [resource, action] = code.split(':')
  return { resource, action }
}
