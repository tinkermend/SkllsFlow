-- ============================================
-- 刷新令牌表 (refresh_tokens)
-- ============================================
-- 说明：存储用户的刷新令牌，用于 JWT 认证
-- Schema: aiops
-- ============================================

-- 删除已存在的表
DROP TABLE IF EXISTS aiops.refresh_tokens CASCADE;

-- 创建刷新令牌表
CREATE TABLE aiops.refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    user_id BIGINT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rotated_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    CONSTRAINT fk_refresh_tokens_user_id FOREIGN KEY (user_id) REFERENCES aiops.users (id) ON DELETE CASCADE
);

-- 表注释
COMMENT ON TABLE aiops.refresh_tokens IS '刷新令牌表：存储用户的刷新令牌，用于 JWT 认证';

-- 字段注释
COMMENT ON COLUMN aiops.refresh_tokens.id IS '主键：数据库内部使用的自增ID';
COMMENT ON COLUMN aiops.refresh_tokens.token_hash IS '令牌哈希：经过哈希的刷新令牌';
COMMENT ON COLUMN aiops.refresh_tokens.device_id IS '设备指纹：用于识别设备';
COMMENT ON COLUMN aiops.refresh_tokens.ip_address IS '登录 IP：用户登录时的 IP 地址';
COMMENT ON COLUMN aiops.refresh_tokens.user_agent IS 'User Agent：用户浏览器信息';
COMMENT ON COLUMN aiops.refresh_tokens.user_id IS '用户ID：外键→users.id';
COMMENT ON COLUMN aiops.refresh_tokens.expires_at IS '过期时间：令牌过期时间';
COMMENT ON COLUMN aiops.refresh_tokens.created_at IS '创建时间：令牌创建时间';
COMMENT ON COLUMN aiops.refresh_tokens.rotated_at IS '轮换时间：令牌轮换时间';
COMMENT ON COLUMN aiops.refresh_tokens.revoked_at IS '撤销时间：令牌撤销时间';

-- 创建索引
CREATE INDEX idx_refresh_tokens_user_id ON aiops.refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_device_id ON aiops.refresh_tokens (device_id);
