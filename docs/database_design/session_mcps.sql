-- ----------------------------------------------------------------------------
-- 2.3 session_mcps - 会话MCP服务关联表
-- ----------------------------------------------------------------------------

CREATE TABLE session_mcps (
    session_id VARCHAR(100) NOT NULL,
    mcp_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (session_id, mcp_id)
);

COMMENT ON TABLE session_mcps IS '会话MCP服务关联表：记录会话中使用的MCP服务';
COMMENT ON COLUMN session_mcps.session_id IS '会话ID：关联 sessions.session_id';
COMMENT ON COLUMN session_mcps.mcp_id IS 'MCP服务ID：关联 mcp_services.id';
COMMENT ON COLUMN session_mcps.created_at IS '关联创建时间';

-- Indexes for session_mcps
CREATE INDEX idx_session_mcps_mcp_id ON session_mcps (mcp_id);
