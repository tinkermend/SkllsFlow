-- ============================================================================
-- Initial Data: Default Permissions
-- ============================================================================

-- 插入基础权限
INSERT INTO
    permissions (
        name,
        resource,
        action,
        description
    )
VALUES
    -- 用户管理权限
    (
        'user_create',
        'user',
        'create',
        '创建用户'
    ),
    (
        'user_read',
        'user',
        'read',
        '查看用户'
    ),
    (
        'user_update',
        'user',
        'update',
        '更新用户'
    ),
    (
        'user_delete',
        'user',
        'delete',
        '删除用户'
    ),
    -- 角色管理权限
    (
        'role_create',
        'role',
        'create',
        '创建角色'
    ),
    (
        'role_read',
        'role',
        'read',
        '查看角色'
    ),
    (
        'role_update',
        'role',
        'update',
        '更新角色'
    ),
    (
        'role_delete',
        'role',
        'delete',
        '删除角色'
    ),
    -- 会话管理权限
    (
        'session_create',
        'session',
        'create',
        '创建会话'
    ),
    (
        'session_read',
        'session',
        'read',
        '查看会话'
    ),
    (
        'session_update',
        'session',
        'update',
        '更新会话'
    ),
    (
        'session_delete',
        'session',
        'delete',
        '删除会话'
    ),
    -- 技能管理权限
    (
        'skill_create',
        'skill',
        'create',
        '创建技能'
    ),
    (
        'skill_read',
        'skill',
        'read',
        '查看技能'
    ),
    (
        'skill_update',
        'skill',
        'update',
        '更新技能'
    ),
    (
        'skill_delete',
        'skill',
        'delete',
        '删除技能'
    ),
    -- MCP服务管理权限
    (
        'mcp_create',
        'mcp',
        'create',
        '创建MCP服务'
    ),
    (
        'mcp_read',
        'mcp',
        'read',
        '查看MCP服务'
    ),
    (
        'mcp_update',
        'mcp',
        'update',
        '更新MCP服务'
    ),
    (
        'mcp_delete',
        'mcp',
        'delete',
        '删除MCP服务'
    ),
    -- Agent管理权限
    (
        'agent_create',
        'agent',
        'create',
        '创建Agent'
    ),
    (
        'agent_read',
        'agent',
        'read',
        '查看Agent'
    ),
    (
        'agent_update',
        'agent',
        'update',
        '更新Agent'
    ),
    (
        'agent_delete',
        'agent',
        'delete',
        '删除Agent'
    );

-- ============================================================================
-- Initial Data: Default Roles
-- ============================================================================

-- 插入默认角色
INSERT INTO
    roles (name, description)
VALUES ('admin', '系统管理员：拥有所有权限'),
    ('user', '普通用户：拥有基本权限'),
    ('guest', '访客：只读权限');

-- ============================================================================
-- Initial Data: Admin Role Permissions
-- ============================================================================

-- 为管理员角色分配所有权限
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT (
        SELECT id
        FROM roles
        WHERE
            name = 'admin'
    ), id
FROM permissions;

-- ============================================================================
-- Initial Data: User Role Permissions
-- ============================================================================

-- 为普通用户角色分配基本权限
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT (
        SELECT id
        FROM roles
        WHERE
            name = 'user'
    ), id
FROM permissions
WHERE
    name IN (
        'session_create',
        'session_read',
        'session_update',
        'session_delete',
        'skill_read',
        'mcp_read',
        'agent_read'
    );

-- ============================================================================
-- Initial Data: Guest Role Permissions
-- ============================================================================

-- 为访客角色分配只读权限
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT (
        SELECT id
        FROM roles
        WHERE
            name = 'guest'
    ), id
FROM permissions
WHERE
    name IN (
        'session_read',
        'skill_read',
        'mcp_read',
        'agent_read'
    );

-- ============================================================================
-- Validation
-- ============================================================================

-- 验证表是否创建成功
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE
    table_schema = 'aiops'
ORDER BY table_name, ordinal_position;

-- 验证索引是否创建成功
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE
    schemaname = 'aiops'
ORDER BY tablename, indexname;

-- 验证外键约束是否创建成功
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE
    contype = 'f'
ORDER BY conrelid::regclass::text, conname;

-- ============================================================================
-- End of Schema
-- ============================================================================