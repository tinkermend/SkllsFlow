-- Active: 1769452445328@@127.0.0.1@5432@aiops@aiops
-- ----------------------------------------------------------------------------
-- 2.1 sessions - 会话表
-- ----------------------------------------------------------------------------

drop table if exists sessions;

drop type if exists session_status;
CREATE TYPE session_status AS ENUM ('active', 'delete');

CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    project_id VARCHAR(64) DEFAULT 'global',
    status session_status NOT NULL DEFAULT 'active',
    opencode_server VARCHAR(120) NOT NULL DEFAULT 'http://127.0.0.1:4096',
    directory VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表注释
COMMENT ON TABLE sessions IS '会话表：存储用户与AI的对话会话';
COMMENT ON COLUMN sessions.id IS '主键：数据库内部使用';
COMMENT ON COLUMN sessions.session_id IS '应用层会话ID：唯一，如ses_405cccef1ffeNG8ZWhyAomZ5Mr';
COMMENT ON COLUMN sessions.user_id IS '用户ID：应用层保证引用完整性（无外键约束）';
COMMENT ON COLUMN sessions.project_id IS '项目ID：默认为global';
COMMENT ON COLUMN sessions.opencode_server IS 'OpenCode 服务器地址：默认为 http://127.0.0.1:4096';
COMMENT ON COLUMN sessions.directory IS '工作目录路径';
COMMENT ON COLUMN sessions.status IS '会话状态：active（活跃）, delete（已删除）';
COMMENT ON COLUMN sessions.created_at IS '创建时间';
COMMENT ON COLUMN sessions.updated_at IS '更新时间';

-- Indexes for sessions
CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_status ON sessions (status);
CREATE INDEX idx_sessions_updated_at ON sessions (updated_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
