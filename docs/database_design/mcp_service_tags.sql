-- Active: 1769677791565@@127.0.0.1@5432@aiops@aiops
-- ============================================
-- MCP 服务标签关联表
-- ============================================

-- MCP 服务标签关联表
CREATE TABLE IF NOT EXISTS aiops.mcp_service_tags (
    mcp_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (mcp_id, tag_id),
    FOREIGN KEY (mcp_id) REFERENCES aiops.mcp_services (id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES aiops.mcp_tags (id) ON DELETE CASCADE
);

COMMENT ON TABLE aiops.mcp_service_tags IS 'MCP 服务与标签的多对多关联表';

COMMENT ON COLUMN aiops.mcp_service_tags.mcp_id IS 'MCP 服务 ID，外键关联 mcp_services 表';
COMMENT ON COLUMN aiops.mcp_service_tags.tag_id IS '标签 ID，外键关联 mcp_tags 表';
COMMENT ON COLUMN aiops.mcp_service_tags.created_at IS '关联创建时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mcp_service_tags_mcp_id ON aiops.mcp_service_tags (mcp_id);
CREATE INDEX IF NOT EXISTS idx_mcp_service_tags_tag_id ON aiops.mcp_service_tags (tag_id);
