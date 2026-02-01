-- ----------------------------------------------------------------------------
-- 2.2 chat_server_agents - 对话Agent关联表
-- ----------------------------------------------------------------------------

CREATE TABLE chat_server_agents (
    chat_id VARCHAR(100) NOT NULL,
    agent_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (chat_id, agent_id)
);

COMMENT ON TABLE chat_server_agents IS 'chat_servers 关联表：记录对话服务中使用的Agent';

COMMENT ON COLUMN chat_server_agents.chat_id IS '会话ID：关联 chat_servers.id';

COMMENT ON COLUMN chat_server_agents.agent_id IS 'Agent ID：关联 agents.id';

COMMENT ON COLUMN chat_server_agents.created_at IS '关联创建时间';

-- Indexes for session_agents
CREATE INDEX idx_chat_server_agents_agent_id ON chat_server_agents (agent_id);