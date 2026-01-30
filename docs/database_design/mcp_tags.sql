-- Active: 1769677791565@@127.0.0.1@5432@aiops@aiops
-- ============================================
-- MCP 标签表
-- ============================================

-- MCP 标签表
CREATE TABLE IF NOT EXISTS aiops.mcp_tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7), -- hex color code
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE aiops.mcp_tags IS 'MCP 标签表，存储通用标签';

COMMENT ON COLUMN aiops.mcp_tags.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.mcp_tags.name IS '标签名称';
COMMENT ON COLUMN aiops.mcp_tags.color IS '标签颜色（十六进制）';
COMMENT ON COLUMN aiops.mcp_tags.created_at IS '创建时间';

-- 插入默认标签
INSERT INTO
    aiops.mcp_tags (name, color)
VALUES ('主机', '#3b82f6'),
    ('测试版', '#f97316'),
    ('稳定版', '#10b981'),
    ('中间件', '#4285f4'),
    ('缓存与消息', '#00a1f1'),
    ('应用服务', '#ff9900'),
    ('数据库', '#ef4444')
ON CONFLICT (name) DO NOTHING;
