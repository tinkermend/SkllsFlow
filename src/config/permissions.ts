/**
 * 系统权限配置清单
 * 用于权限同步到数据库
 */

export type PermissionDefinition = {
  code: string
  name: string
  resource: string
  action: string
  module: string
  description?: string
}

/**
 * 权限清单
 * 格式: resource:action
 */
export const PERMISSIONS: PermissionDefinition[] = [
  // 用户管理模块
  {
    code: 'user:view',
    name: '查看用户',
    resource: 'user',
    action: 'view',
    module: '用户管理',
    description: '查看用户列表和详情',
  },
  {
    code: 'user:create',
    name: '创建用户',
    resource: 'user',
    action: 'create',
    module: '用户管理',
    description: '创建新用户',
  },
  {
    code: 'user:update',
    name: '更新用户',
    resource: 'user',
    action: 'update',
    module: '用户管理',
    description: '编辑用户信息',
  },
  {
    code: 'user:delete',
    name: '删除用户',
    resource: 'user',
    action: 'delete',
    module: '用户管理',
    description: '删除用户',
  },
  {
    code: 'user:assign-roles',
    name: '分配角色',
    resource: 'user',
    action: 'assign-roles',
    module: '用户管理',
    description: '为用户分配角色',
  },

  // 角色管理模块
  {
    code: 'role:view',
    name: '查看角色',
    resource: 'role',
    action: 'view',
    module: '角色管理',
    description: '查看角色列表和详情',
  },
  {
    code: 'role:create',
    name: '创建角色',
    resource: 'role',
    action: 'create',
    module: '角色管理',
    description: '创建新角色',
  },
  {
    code: 'role:update',
    name: '更新角色',
    resource: 'role',
    action: 'update',
    module: '角色管理',
    description: '编辑角色信息',
  },
  {
    code: 'role:delete',
    name: '删除角色',
    resource: 'role',
    action: 'delete',
    module: '角色管理',
    description: '删除角色',
  },

  // 权限管理模块
  {
    code: 'permission:view',
    name: '查看权限',
    resource: 'permission',
    action: 'view',
    module: '权限管理',
    description: '查看权限列表',
  },
  {
    code: 'permission:sync',
    name: '同步权限',
    resource: 'permission',
    action: 'sync',
    module: '权限管理',
    description: '同步权限配置到数据库',
  },

  // 技能管理模块
  {
    code: 'skill:view',
    name: '查看技能',
    resource: 'skill',
    action: 'view',
    module: '技能管理',
    description: '查看技能列表和详情',
  },
  {
    code: 'skill:create',
    name: '创建技能',
    resource: 'skill',
    action: 'create',
    module: '技能管理',
    description: '创建新技能',
  },
  {
    code: 'skill:update',
    name: '更新技能',
    resource: 'skill',
    action: 'update',
    module: '技能管理',
    description: '编辑技能信息',
  },
  {
    code: 'skill:delete',
    name: '删除技能',
    resource: 'skill',
    action: 'delete',
    module: '技能管理',
    description: '删除技能',
  },
  {
    code: 'skill:install',
    name: '装载技能',
    resource: 'skill',
    action: 'install',
    module: '技能管理',
    description: '装载平台技能到 ChatServer',
  },
  {
    code: 'skill:uninstall',
    name: '卸载技能',
    resource: 'skill',
    action: 'uninstall',
    module: '技能管理',
    description: '卸载当前用户已装载的技能',
  },
  {
    code: 'skill:publish',
    name: '发布技能',
    resource: 'skill',
    action: 'publish',
    module: '技能管理',
    description: '发布技能到平台',
  },

  // 会话管理模块
  {
    code: 'session:view',
    name: '查看会话',
    resource: 'session',
    action: 'view',
    module: '会话管理',
    description: '查看会话列表和详情',
  },
  {
    code: 'session:create',
    name: '创建会话',
    resource: 'session',
    action: 'create',
    module: '会话管理',
    description: '创建新会话',
  },
  {
    code: 'session:update',
    name: '更新会话',
    resource: 'session',
    action: 'update',
    module: '会话管理',
    description: '更新会话信息',
  },
  {
    code: 'session:delete',
    name: '删除会话',
    resource: 'session',
    action: 'delete',
    module: '会话管理',
    description: '删除会话',
  },

  // 服务管理模块
  {
    code: 'chatServer:view',
    name: '查看服务',
    resource: 'chatServer',
    action: 'view',
    module: '服务管理',
    description: '查看服务列表和详情',
  },
  {
    code: 'chatServer:create',
    name: '创建服务',
    resource: 'chatServer',
    action: 'create',
    module: '服务管理',
    description: '创建新的 ChatServer 服务',
  },
  {
    code: 'chatServer:update',
    name: '更新服务',
    resource: 'chatServer',
    action: 'update',
    module: '服务管理',
    description: '重命名或修改 ChatServer 服务',
  },
  {
    code: 'chatServer:delete',
    name: '删除服务',
    resource: 'chatServer',
    action: 'delete',
    module: '服务管理',
    description: '删除 ChatServer 服务',
  },
  {
    code: 'chatServer:connect',
    name: '连接服务',
    resource: 'chatServer',
    action: 'connect',
    module: '服务管理',
    description: '连接或激活 ChatServer 服务',
  },

  // 菜单管理模块
  {
    code: 'menu:view',
    name: '查看菜单',
    resource: 'menu',
    action: 'view',
    module: '菜单管理',
    description: '查看菜单列表和详情',
  },
  {
    code: 'menu:create',
    name: '创建菜单',
    resource: 'menu',
    action: 'create',
    module: '菜单管理',
    description: '创建新菜单',
  },
  {
    code: 'menu:update',
    name: '更新菜单',
    resource: 'menu',
    action: 'update',
    module: '菜单管理',
    description: '编辑菜单信息',
  },
  {
    code: 'menu:delete',
    name: '删除菜单',
    resource: 'menu',
    action: 'delete',
    module: '菜单管理',
    description: '删除菜单',
  },

  // 系统设置模块
  {
    code: 'system:view',
    name: '查看系统设置',
    resource: 'system',
    action: 'view',
    module: '系统设置',
    description: '查看系统配置',
  },
  {
    code: 'system:update',
    name: '更新系统设置',
    resource: 'system',
    action: 'update',
    module: '系统设置',
    description: '修改系统配置',
  },
]

/**
 * 按模块分组权限
 */
export function getPermissionsByModule(): Record<string, PermissionDefinition[]> {
  return PERMISSIONS.reduce(
    (acc, permission) => {
      const module = permission.module
      if (!acc[module]) {
        acc[module] = []
      }
      acc[module].push(permission)
      return acc
    },
    {} as Record<string, PermissionDefinition[]>
  )
}

/**
 * 获取所有模块名称
 */
export function getModules(): string[] {
  return Array.from(new Set(PERMISSIONS.map((p) => p.module)))
}
