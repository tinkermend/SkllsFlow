-- ----------------------------------------------------------------------------
-- 1.5 role_permissions - 角色权限关联表
-- ----------------------------------------------------------------------------

CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id varchar(64) NOT NULL,
    permission_id varchar(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES roles (role_id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions (permission_id) ON DELETE CASCADE,
    CONSTRAINT uniq_role_permissions_role_id_permission_id UNIQUE (role_id, permission_id)
);

-- 表注释
COMMENT ON TABLE role_permissions IS '角色权限关联表：多对多关系，连接角色和权限';

-- 字段注释
COMMENT ON COLUMN role_permissions.id IS '主键：数据库内部使用';
COMMENT ON COLUMN role_permissions.role_id IS '角色ID：外键→roles.role_id';
COMMENT ON COLUMN role_permissions.permission_id IS '权限ID：外键→permissions.permission_id';
COMMENT ON COLUMN role_permissions.created_at IS '创建时间';

-- Indexes for role_permissions
CREATE INDEX idx_role_permissions_role_id ON role_permissions (role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions (permission_id);
