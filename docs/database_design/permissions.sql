-- ----------------------------------------------------------------------------
-- 1.3 permissions - 权限表
-- ----------------------------------------------------------------------------

CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    permission_id VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL UNIQUE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表注释
COMMENT ON TABLE permissions IS '权限表：定义系统权限，每个权限代表一个可执行的操作';

-- 字段注释
COMMENT ON COLUMN permissions.id IS '主键：数据库内部使用';
COMMENT ON COLUMN permissions.permission_id IS '权限ID：唯一标识符';
COMMENT ON COLUMN permissions.name IS '权限名称：格式为{resource}_{action}，如user_create';
COMMENT ON COLUMN permissions.resource IS '资源类型：如user, role, session, skill, agent';
COMMENT ON COLUMN permissions.action IS '操作类型：如create, read, update, delete';
COMMENT ON COLUMN permissions.description IS '权限描述';
COMMENT ON COLUMN permissions.created_at IS '创建时间';

-- Indexes for permissions
CREATE INDEX idx_permissions_resource_action ON permissions (resource, action);
