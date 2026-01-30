-- Active: 1769677791565@@127.0.0.1@5432@aiops@aiops
-- ============================================
-- MCP 工具定义表
-- ============================================

-- MCP 工具定义表
CREATE TABLE IF NOT EXISTS aiops.mcp_tools (
    id BIGSERIAL PRIMARY KEY,
    mcp_id BIGINT NOT NULL,
    tool_name VARCHAR(120) NOT NULL,
    tool_description TEXT,
    tool_schema JSONB NOT NULL, -- JSON Schema 定义
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (mcp_id, tool_name),
    FOREIGN KEY (mcp_id) REFERENCES aiops.mcp_services (id) ON DELETE CASCADE
);

COMMENT ON TABLE aiops.mcp_tools IS 'MCP 工具定义表，存储每个 MCP 服务提供的工具';

COMMENT ON COLUMN aiops.mcp_tools.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.mcp_tools.mcp_id IS 'MCP 服务 ID，外键关联 mcp_services 表';
COMMENT ON COLUMN aiops.mcp_tools.tool_name IS '工具名称';
COMMENT ON COLUMN aiops.mcp_tools.tool_description IS '工具描述';
COMMENT ON COLUMN aiops.mcp_tools.tool_schema IS '工具参数 JSON Schema 定义';
COMMENT ON COLUMN aiops.mcp_tools.created_at IS '创建时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mcp_tools_mcp_id ON aiops.mcp_tools (mcp_id);
