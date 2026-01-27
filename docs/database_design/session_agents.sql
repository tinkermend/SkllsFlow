-- ----------------------------------------------------------------------------
-- 2.2 session_agents - 会话Agent关联表
-- ----------------------------------------------------------------------------

CREATE TABLE session_agents (
    session_id VARCHAR(100) NOT NULL,
    agent_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (session_id, agent_id)
);

COMMENT ON TABLE session_agents IS '会话Agent关联表：记录会话中使用的Agent';
COMMENT ON COLUMN session_agents.session_id IS '会话ID：关联 sessions.session_id';
COMMENT ON COLUMN session_agents.agent_id IS 'Agent ID：关联 agents.id';
COMMENT ON COLUMN session_agents.created_at IS '关联创建时间';

-- Indexes for session_agents
CREATE INDEX idx_session_agents_agent_id ON session_agents (agent_id);
