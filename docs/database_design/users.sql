-- ----------------------------------------------------------------------------
-- 1.1 users - 用户表
-- ----------------------------------------------------------------------------

drop table if exists users;

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
        status IN (
            'active',
            'deleted',
            'disabled'
        )
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表注释
COMMENT ON TABLE users IS '用户表：存储平台用户信息和认证凭据';

-- 字段注释
COMMENT ON COLUMN users.id IS '主键：数据库内部使用';

COMMENT ON COLUMN users.user_id IS '用户ID：对外暴露的唯一标识';

COMMENT ON COLUMN users.username IS '用户名：唯一，3-50字符';

COMMENT ON COLUMN users.password_hash IS '加密密码：使用bcrypt';

COMMENT ON COLUMN users.email IS '邮箱：可选，唯一';

COMMENT ON COLUMN users.full_name IS '全名';

COMMENT ON COLUMN users.status IS '状态：active（活跃）, deleted（已删除）, disabled（已禁用）';

COMMENT ON COLUMN users.created_at IS '创建时间';

COMMENT ON COLUMN users.updated_at IS '更新时间';

-- Indexes for users
CREATE INDEX idx_users_status ON users (status);

CREATE INDEX idx_users_user_id ON users (user_id);

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();