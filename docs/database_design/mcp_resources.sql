-- Active: 1769677791565@@127.0.0.1@5432@aiops@aiops
-- ============================================
-- MCP 资源定义表
-- ============================================

-- MCP 资源定义表
CREATE TABLE IF NOT EXISTS aiops.mcp_resources (
    id BIGSERIAL PRIMARY KEY,
    mcp_id BIGINT NOT NULL,
    resource_name VARCHAR(120) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_description TEXT,
    resource_schema JSONB, -- 可选的资源模式定义
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (mcp_id, resource_name),
    FOREIGN KEY (mcp_id) REFERENCES aiops.mcp_services (id) ON DELETE CASCADE
);

COMMENT ON TABLE aiops.mcp_resources IS 'MCP 资源定义表，存储每个 MCP 服务提供的资源';

COMMENT ON COLUMN aiops.mcp_resources.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.mcp_resources.mcp_id IS 'MCP 服务 ID，外键关联 mcp_services 表';
COMMENT ON COLUMN aiops.mcp_resources.resource_name IS '资源名称';
COMMENT ON COLUMN aiops.mcp_resources.resource_type IS '资源类型';
COMMENT ON COLUMN aiops.mcp_resources.resource_description IS '资源描述';
COMMENT ON COLUMN aiops.mcp_resources.resource_schema IS '资源模式定义（可选）';
COMMENT ON COLUMN aiops.mcp_resources.created_at IS '创建时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mcp_resources_mcp_id ON aiops.mcp_resources (mcp_id);
