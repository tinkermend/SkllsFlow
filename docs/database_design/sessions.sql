
-- ----------------------------------------------------------------------------
-- 2.1 sessions - 会话表
-- ----------------------------------------------------------------------------

drop table if exists aiops.sessions;

CREATE TABLE aiops.sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    chat_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表注释
COMMENT ON TABLE sessions IS '会话表：存储用户与AI的对话会话';

COMMENT ON COLUMN sessions.id IS '主键：数据库内部使用';

COMMENT ON COLUMN sessions.session_id IS '应用层会话ID：唯一，如ses_405cccef1ffeNG8ZWhyAomZ5Mr';

COMMENT ON COLUMN sessions.chat_id IS '聊天服务ID：关联chat_servers表的 id';

COMMENT ON COLUMN sessions.created_at IS '创建时间';


create index idx_sessions_chat_id on aiops.sessions (chat_id);
