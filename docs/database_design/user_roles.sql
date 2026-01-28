-- ============================================
-- 用户-角色关联表 (user_roles)
-- ============================================
-- 说明：多对多关系，连接用户和角色
-- Schema: aiops
-- ============================================

-- 删除已存在的表
DROP TABLE IF EXISTS aiops.user_roles CASCADE;

-- 创建用户-角色关联表
CREATE TABLE aiops.user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES aiops.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES aiops.roles (id) ON DELETE CASCADE,
    CONSTRAINT uniq_user_roles_user_id_role_id UNIQUE (user_id, role_id)
);

-- 表注释
COMMENT ON TABLE aiops.user_roles IS '用户角色关联表：多对多关系，连接用户和角色';

-- 字段注释
COMMENT ON COLUMN aiops.user_roles.id IS '主键：数据库内部使用的自增ID';
COMMENT ON COLUMN aiops.user_roles.user_id IS '用户ID：外键→users.id';
COMMENT ON COLUMN aiops.user_roles.role_id IS '角色ID：外键→roles.id';
COMMENT ON COLUMN aiops.user_roles.created_at IS '创建时间：记录创建时间';

-- 创建索引
CREATE INDEX idx_user_roles_user_id ON aiops.user_roles (user_id);
CREATE INDEX idx_user_roles_role_id ON aiops.user_roles (role_id);
