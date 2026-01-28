-- ============================================
-- 用户表 (users)
-- ============================================
-- 说明：存储平台用户信息和认证凭据
-- Schema: aiops
-- ============================================

-- 删除已存在的表
DROP TABLE IF EXISTS aiops.users CASCADE;

-- 创建用户状态枚举类型
DO $$ BEGIN
    CREATE TYPE aiops.user_status AS ENUM ('active', 'disabled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建用户表
CREATE TABLE aiops.users (
    id BIGSERIAL PRIMARY KEY,
    account_no VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    avatar VARCHAR(500),
    status aiops.user_status NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表注释
COMMENT ON TABLE aiops.users IS '用户表：存储平台用户信息和认证凭据';

-- 字段注释
COMMENT ON COLUMN aiops.users.id IS '主键：数据库内部使用的自增ID';
COMMENT ON COLUMN aiops.users.account_no IS '账号：对外暴露的唯一标识符';
COMMENT ON COLUMN aiops.users.email IS '邮箱：用户邮箱地址，唯一';
COMMENT ON COLUMN aiops.users.password_hash IS '密码哈希：使用 bcrypt 加密的密码';
COMMENT ON COLUMN aiops.users.username IS '用户名：可选的显示名称';
COMMENT ON COLUMN aiops.users.avatar IS '头像：头像 URL 地址';
COMMENT ON COLUMN aiops.users.status IS '状态：active（激活）、disabled（禁用）';
COMMENT ON COLUMN aiops.users.last_login_at IS '最后登录时间：用户最后一次登录的时间';
COMMENT ON COLUMN aiops.users.created_at IS '创建时间：记录创建时间';
COMMENT ON COLUMN aiops.users.updated_at IS '更新时间：记录最后更新时间';

-- 创建索引
CREATE INDEX idx_users_status ON aiops.users (status);
CREATE INDEX idx_users_account_no ON aiops.users (account_no);
CREATE INDEX idx_users_email ON aiops.users (email);

-- 创建更新时间触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON aiops.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
