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
        user_uuid,
        account_no,
        email,
        password_hash,
        username,
        status,
        created_at,
        updated_at
    )
VALUES (
        gen_random_uuid(),
        'admin',
        'admin@aiops.com',
        '$2b$10$P55QrQQoiQEsWF9NfBHghe2AynNOQ4u5iWk60fz44igfov32LeOJi',
        '管理员',
        'active',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
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
        '用户管理',
        NOW(),
        NOW()
    ),
    (
        '创建用户',
        'user:create',
        'user',
        'create',
        '用户管理',
        NOW(),
        NOW()
    ),
    (
        '更新用户',
        'user:update',
        'user',
        'update',
        '用户管理',
        NOW(),
        NOW()
    ),
    (
        '删除用户',
        'user:delete',
        'user',
        'delete',
        '用户管理',
        NOW(),
        NOW()
    ),
    (
        '分配角色',
        'user:assign-roles',
        'user',
        'assign-roles',
        '用户管理',
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
        '角色管理',
        NOW(),
        NOW()
    ),
    (
        '创建角色',
        'role:create',
        'role',
        'create',
        '角色管理',
        NOW(),
        NOW()
    ),
    (
        '更新角色',
        'role:update',
        'role',
        'update',
        '角色管理',
        NOW(),
        NOW()
    ),
    (
        '删除角色',
        'role:delete',
        'role',
        'delete',
        '角色管理',
        NOW(),
        NOW()
    ),
    (
        '分配权限',
        'role:assign-permissions',
        'role',
        'assign-permissions',
        '角色管理',
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- 3.3 权限管理权限
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
        '查看权限',
        'permission:view',
        'permission',
        'view',
        '权限管理',
        NOW(),
        NOW()
    ),
    (
        '同步权限',
        'permission:sync',
        'permission',
        'sync',
        '权限管理',
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- 3.4 会话管理权限
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
        '会话管理',
        NOW(),
        NOW()
    ),
    (
        '创建会话',
        'session:create',
        'session',
        'create',
        '会话管理',
        NOW(),
        NOW()
    ),
    (
        '更新会话',
        'session:update',
        'session',
        'update',
        '会话管理',
        NOW(),
        NOW()
    ),
    (
        '删除会话',
        'session:delete',
        'session',
        'delete',
        '会话管理',
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- 3.5 技能管理权限
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
        '技能管理',
        NOW(),
        NOW()
    ),
    (
        '创建技能',
        'skill:create',
        'skill',
        'create',
        '技能管理',
        NOW(),
        NOW()
    ),
    (
        '更新技能',
        'skill:update',
        'skill',
        'update',
        '技能管理',
        NOW(),
        NOW()
    ),
    (
        '删除技能',
        'skill:delete',
        'skill',
        'delete',
        '技能管理',
        NOW(),
        NOW()
    ),
    (
        '装载技能',
        'skill:install',
        'skill',
        'install',
        '技能管理',
        NOW(),
        NOW()
    ),
    (
        '卸载技能',
        'skill:uninstall',
        'skill',
        'uninstall',
        '技能管理',
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- 3.6 MCP 管理权限
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
        'MCP管理',
        NOW(),
        NOW()
    ),
    (
        '创建MCP',
        'mcp:create',
        'mcp',
        'create',
        'MCP管理',
        NOW(),
        NOW()
    ),
    (
        '更新MCP',
        'mcp:update',
        'mcp',
        'update',
        'MCP管理',
        NOW(),
        NOW()
    ),
    (
        '删除MCP',
        'mcp:delete',
        'mcp',
        'delete',
        'MCP管理',
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- 3.7 Agent 管理权限
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
        'Agent管理',
        NOW(),
        NOW()
    ),
    (
        '创建Agent',
        'agent:create',
        'agent',
        'create',
        'Agent管理',
        NOW(),
        NOW()
    ),
    (
        '更新Agent',
        'agent:update',
        'agent',
        'update',
        'Agent管理',
        NOW(),
        NOW()
    ),
    (
        '删除Agent',
        'agent:delete',
        'agent',
        'delete',
        'Agent管理',
        NOW(),
        NOW()
    )
ON CONFLICT (code) DO NOTHING;

-- 3.8 菜单管理权限
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
        '查看菜单',
        'menu:view',
        'menu',
        'view',
        '菜单管理',
        NOW(),
        NOW()
    ),
    (
        '创建菜单',
        'menu:create',
        'menu',
        'create',
        '菜单管理',
        NOW(),
        NOW()
    ),
    (
        '更新菜单',
        'menu:update',
        'menu',
        'update',
        '菜单管理',
        NOW(),
        NOW()
    ),
    (
        '删除菜单',
        'menu:delete',
        'menu',
        'delete',
        '菜单管理',
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

-- ============================================
-- 技能测试数据
-- ============================================
-- 说明：初始化技能表测试数据
-- ============================================

-- 7. 插入技能测试数据
INSERT INTO
    aiops.skills (
        skill_id,
        name,
        description,
        icon,
        category,
        tags,
        status,
        sort_order,
        file_path,
        created_by,
        created_at,
        updated_at
    )
VALUES
    (
        'code-review-assistant',
        '代码审查助手',
        '智能代码审查工具，支持多种编程语言的代码质量检查、安全漏洞扫描和最佳实践建议',
        'lucide:code-2',
        'code-analysis',
        ARRAY['代码审查', '质量检查', '安全扫描', 'TypeScript', 'JavaScript', 'Python'],
        'active',
        1,
        '/skills/code-review-assistant.zip',
        (SELECT id FROM aiops.users WHERE account_no = 'admin'),
        NOW(),
        NOW()
    ),
    (
        'data-visualization',
        '数据可视化生成器',
        '根据数据自动生成图表和可视化报告，支持多种图表类型（折线图、柱状图、饼图等）',
        'lucide:bar-chart-3',
        'data-processing',
        ARRAY['数据分析', '图表生成', '可视化', 'ECharts', 'D3.js'],
        'active',
        2,
        '/skills/data-visualization.zip',
        (SELECT id FROM aiops.users WHERE account_no = 'admin'),
        NOW(),
        NOW()
    )
ON CONFLICT (skill_id) DO NOTHING;