-- ============================================
-- RBAC 系统种子数据
-- ============================================
-- 说明：初始化用户、角色、权限和关联关系
-- Schema: aiops
-- ============================================

-- 1. 插入用户数据
-- 密码：admin123 和 user123（bcrypt 加密，10 轮）

-- node - e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10, (err, hash) => { console.log('admin123:', hash); }); bcrypt.hash('user123', 10, (err, hash) => { console.log('user123:', hash); });"

INSERT INTO
    aiops.users (
        account_no,
        email,
        password_hash,
        username,
        status,
        created_at,
        updated_at
    )
VALUES (
        'admin',
        'admin@aiops.com',
        '$2b$10$P55QrQQoiQEsWF9NfBHghe2AynNOQ4u5iWk60fz44igfov32LeOJi',
        '管理员',
        'active',
        NOW(),
        NOW()
    ),
    (
        'user',
        'user@aiops.com',
        '$2b$10$EPDsHeaP/y28HS5spQMPZujDUz9iEU1yLXkrG0NbbA6kN2XCaNH4G',
        '普通用户',
        'active',
        NOW(),
        NOW()
    )
ON CONFLICT (account_no) DO NOTHING;

-- 2. 插入角色数据
INSERT INTO
    aiops.roles (
        name,
        code,
        description,
        is_system,
        sort,
        status,
        created_at,
        updated_at
    )
VALUES (
        '管理员',
        'admin',
        '系统管理员，拥有所有权限',
        true,
        1,
        'active',
        NOW(),
        NOW()
    ),
    (
        '普通用户',
        'user',
        '普通用户，拥有基础权限',
        true,
        2,
        'active',
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- 3. 插入权限数据
-- 3.1 用户管理权限
INSERT INTO
    aiops.permissions (
        name,
        code,
        resource,
        action,
        module,
        created_at,
        updated_at
    )
VALUES (
        '查看用户',
        'user:view',
        'user',
        'view',
        'users',
        NOW(),
        NOW()
    ),
    (
        '创建用户',
        'user:create',
        'user',
        'create',
        'users',
        NOW(),
        NOW()
    ),
    (
        '更新用户',
        'user:update',
        'user',
        'update',
        'users',
        NOW(),
        NOW()
    ),
    (
        '删除用户',
        'user:delete',
        'user',
        'delete',
        'users',
        NOW(),
        NOW()
    ),
    (
        '分配角色',
        'user:assign-roles',
        'user',
        'assign-roles',
        'users',
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- 3.2 角色管理权限
INSERT INTO
    aiops.permissions (
        name,
        code,
        resource,
        action,
        module,
        created_at,
        updated_at
    )
VALUES (
        '查看角色',
        'role:view',
        'role',
        'view',
        'roles',
        NOW(),
        NOW()
    ),
    (
        '创建角色',
        'role:create',
        'role',
        'create',
        'roles',
        NOW(),
        NOW()
    ),
    (
        '更新角色',
        'role:update',
        'role',
        'update',
        'roles',
        NOW(),
        NOW()
    ),
    (
        '删除角色',
        'role:delete',
        'role',
        'delete',
        'roles',
        NOW(),
        NOW()
    ),
    (
        '分配权限',
        'role:assign-permissions',
        'role',
        'assign-permissions',
        'roles',
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- 3.3 会话管理权限
INSERT INTO
    aiops.permissions (
        name,
        code,
        resource,
        action,
        module,
        created_at,
        updated_at
    )
VALUES (
        '查看会话',
        'session:view',
        'session',
        'view',
        'sessions',
        NOW(),
        NOW()
    ),
    (
        '创建会话',
        'session:create',
        'session',
        'create',
        'sessions',
        NOW(),
        NOW()
    ),
    (
        '更新会话',
        'session:update',
        'session',
        'update',
        'sessions',
        NOW(),
        NOW()
    ),
    (
        '删除会话',
        'session:delete',
        'session',
        'delete',
        'sessions',
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- 3.4 技能管理权限
INSERT INTO
    aiops.permissions (
        name,
        code,
        resource,
        action,
        module,
        created_at,
        updated_at
    )
VALUES (
        '查看技能',
        'skill:view',
        'skill',
        'view',
        'skills',
        NOW(),
        NOW()
    ),
    (
        '创建技能',
        'skill:create',
        'skill',
        'create',
        'skills',
        NOW(),
        NOW()
    ),
    (
        '更新技能',
        'skill:update',
        'skill',
        'update',
        'skills',
        NOW(),
        NOW()
    ),
    (
        '删除技能',
        'skill:delete',
        'skill',
        'delete',
        'skills',
        NOW(),
        NOW()
    ),
    (
        '装载技能',
        'skill:install',
        'skill',
        'install',
        'skills',
        NOW(),
        NOW()
    ),
    (
        '卸载技能',
        'skill:uninstall',
        'skill',
        'uninstall',
        'skills',
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- 3.5 MCP 管理权限
INSERT INTO
    aiops.permissions (
        name,
        code,
        resource,
        action,
        module,
        created_at,
        updated_at
    )
VALUES (
        '查看MCP',
        'mcp:view',
        'mcp',
        'view',
        'mcps',
        NOW(),
        NOW()
    ),
    (
        '创建MCP',
        'mcp:create',
        'mcp',
        'create',
        'mcps',
        NOW(),
        NOW()
    ),
    (
        '更新MCP',
        'mcp:update',
        'mcp',
        'update',
        'mcps',
        NOW(),
        NOW()
    ),
    (
        '删除MCP',
        'mcp:delete',
        'mcp',
        'delete',
        'mcps',
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- 3.6 Agent 管理权限
INSERT INTO
    aiops.permissions (
        name,
        code,
        resource,
        action,
        module,
        created_at,
        updated_at
    )
VALUES (
        '查看Agent',
        'agent:view',
        'agent',
        'view',
        'agents',
        NOW(),
        NOW()
    ),
    (
        '创建Agent',
        'agent:create',
        'agent',
        'create',
        'agents',
        NOW(),
        NOW()
    ),
    (
        '更新Agent',
        'agent:update',
        'agent',
        'update',
        'agents',
        NOW(),
        NOW()
    ),
    (
        '删除Agent',
        'agent:delete',
        'agent',
        'delete',
        'agents',
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- 4. 为管理员角色分配所有权限
INSERT INTO aiops.role_permissions (role_id, permission_id, created_at)
SELECT
  (SELECT id FROM aiops.roles WHERE code = 'admin'),
  p.id,
  NOW()
FROM aiops.permissions p
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. 为普通用户角色分配基础权限
INSERT INTO aiops.role_permissions (role_id, permission_id, created_at)
SELECT
  (SELECT id FROM aiops.roles WHERE code = 'user'),
  p.id,
  NOW()
FROM aiops.permissions p
WHERE p.code IN (
  'session:view',
  'session:create',
  'session:update',
  'skill:view',
  'mcp:view',
  'agent:view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 6. 为用户分配角色
INSERT INTO aiops.user_roles (user_id, role_id, created_at)
VALUES
  (
    (SELECT id FROM aiops.users WHERE account_no = 'admin'),
    (SELECT id FROM aiops.roles WHERE code = 'admin'),
    NOW()
  ),
  (
    (SELECT id FROM aiops.users WHERE account_no = 'user'),
    (SELECT id FROM aiops.roles WHERE code = 'user'),
    NOW()
  )
ON CONFLICT (user_id, role_id) DO NOTHING;