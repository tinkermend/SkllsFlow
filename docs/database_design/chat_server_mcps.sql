-- ----------------------------------------------------------------------------
-- 2.3 chat_server_mcps - 会话MCP服务关联表
-- ----------------------------------------------------------------------------

CREATE TABLE chat_server_mcps (
    chat_id VARCHAR(100) NOT NULL,
    mcp_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (chat_id, mcp_id)
);

COMMENT ON TABLE chat_server_mcps IS '对话MCP服务关联表：记录对话服务中使用的MCP服务';

COMMENT ON COLUMN chat_server_mcps.chat_id IS '会话ID：关联 chat_servers.id';

COMMENT ON COLUMN chat_server_mcps.mcp_id IS 'MCP服务ID：关联 mcp_services.id';

COMMENT ON COLUMN chat_server_mcps.created_at IS '创建时间';

-- Indexes for session_mcps
CREATE INDEX idx_chat_server_mcps_mcp_id ON chat_server_mcps (mcp_id);