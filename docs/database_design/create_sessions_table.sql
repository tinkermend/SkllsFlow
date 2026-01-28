-- 在 aiops schema 下创建 sessions 表
-- Active: 1769452445328@@127.0.0.1@5432@aiops@aiops

-- 确保 aiops schema 存在
CREATE SCHEMA IF NOT EXISTS aiops;

-- 在 aiops schema 下创建 sessions 表
DROP TABLE IF EXISTS aiops.sessions;

CREATE TABLE aiops.sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    project_id VARCHAR(64) DEFAULT 'global',
    status aiops.session_status NOT NULL DEFAULT 'active',
    opencode_server VARCHAR(120) NOT NULL DEFAULT 'http://127.0.0.1:4096',
    directory VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表注释
COMMENT ON TABLE aiops.sessions IS '会话表：存储用户与AI的对话会话';
COMMENT ON COLUMN aiops.sessions.id IS '主键：数据库内部使用';
COMMENT ON COLUMN aiops.sessions.session_id IS '应用层会话ID：唯一，如ses_405cccef1ffeNG8ZWhyAomZ5Mr';
COMMENT ON COLUMN aiops.sessions.user_id IS '用户ID：应用层保证引用完整性（无外键约束）';
COMMENT ON COLUMN aiops.sessions.project_id IS '项目ID：默认为global';
COMMENT ON COLUMN aiops.sessions.opencode_server IS 'OpenCode 服务器地址：默认为 http://127.0.0.1:4096';
COMMENT ON COLUMN aiops.sessions.directory IS '工作目录路径';
COMMENT ON COLUMN aiops.sessions.status IS '会话状态：active（活跃）, delete（已删除）';
COMMENT ON COLUMN aiops.sessions.created_at IS '创建时间';
COMMENT ON COLUMN aiops.sessions.updated_at IS '更新时间';

-- Indexes
CREATE INDEX idx_sessions_user_id ON aiops.sessions (user_id);
CREATE INDEX idx_sessions_status ON aiops.sessions (status);
CREATE INDEX idx_sessions_updated_at ON aiops.sessions (updated_at DESC);

-- 验证表创建成功
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'aiops'
  AND table_name = 'sessions';
