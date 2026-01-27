-- ----------------------------------------------------------------------------
-- 2.5 messages - 消息表
-- ----------------------------------------------------------------------------

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    message_id varchar(64) NOT NULL UNIQUE,
    session_id VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (
        role IN ('user', 'assistant', 'system')
    ),
    created_by BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表注释
COMMENT ON TABLE messages IS '消息表：存储会话中的所有消息';

-- 字段注释
COMMENT ON COLUMN messages.id IS '主键：数据库内部使用';
COMMENT ON COLUMN messages.message_id IS '消息ID：唯一标识';
COMMENT ON COLUMN messages.session_id IS '会话ID：应用层保证引用完整性（无外键约束）';
COMMENT ON COLUMN messages.content IS '消息内容：TEXT类型';
COMMENT ON COLUMN messages.role IS '消息角色：user（用户）, assistant（AI助手）, system（系统）';
COMMENT ON COLUMN messages.created_by IS '创建人ID：user角色时为用户ID';
COMMENT ON COLUMN messages.created_at IS '创建时间';

-- Indexes for messages
CREATE INDEX idx_messages_session_id ON messages (session_id);
CREATE INDEX idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX idx_messages_session_id_created_at ON messages (session_id, created_at DESC);
