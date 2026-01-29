-- ============================================
-- 角色-权限关联表 (role_permissions)
-- ============================================
-- 说明：多对多关系，连接角色和权限
-- Schema: aiops
-- ============================================

-- 删除已存在的表
DROP TABLE IF EXISTS aiops.role_permissions CASCADE;

-- 创建角色-权限关联表
CREATE TABLE aiops.role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES aiops.roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES aiops.permissions (id) ON DELETE CASCADE,
    CONSTRAINT uniq_role_permissions_role_id_permission_id UNIQUE (role_id, permission_id)
);

-- 表注释
COMMENT ON TABLE aiops.role_permissions IS '角色权限关联表：多对多关系，连接角色和权限';

-- 字段注释
COMMENT ON COLUMN aiops.role_permissions.id IS '主键：数据库内部使用的自增ID';
COMMENT ON COLUMN aiops.role_permissions.role_id IS '角色ID：外键→roles.id';
COMMENT ON COLUMN aiops.role_permissions.permission_id IS '权限ID：外键→permissions.id';
COMMENT ON COLUMN aiops.role_permissions.created_at IS '创建时间：记录创建时间';

-- 创建索引
CREATE INDEX idx_role_permissions_role_id ON aiops.role_permissions (role_id);
CREATE INDEX idx_role_permissions_permission_id ON aiops.role_permissions (permission_id);
