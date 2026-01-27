-- ----------------------------------------------------------------------------
-- 1.4 user_roles - 用户角色关联表
-- ----------------------------------------------------------------------------

CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id varchar(64) NOT NULL,
    role_id varchar(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES roles (role_id) ON DELETE CASCADE,
    CONSTRAINT uniq_user_roles_user_id_role_id UNIQUE (user_id, role_id)
);

-- 表注释
COMMENT ON TABLE user_roles IS '用户角色关联表：多对多关系，连接用户和角色';

-- 字段注释
COMMENT ON COLUMN user_roles.id IS '主键：数据库内部使用';
COMMENT ON COLUMN user_roles.user_id IS '用户ID：外键→users.user_id';
COMMENT ON COLUMN user_roles.role_id IS '角色ID：外键→roles.role_id';
COMMENT ON COLUMN user_roles.created_at IS '创建时间';

-- Indexes for user_roles
CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);
