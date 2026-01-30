-- Active: 1769677791565@@127.0.0.1@5432@aiops@aiops
-- ============================================
-- MCP 市场项目表
-- ============================================

DROP TABLE IF EXISTS aiops.mcp_marketplace_items;

-- MCP 市场表（扩展的 MCP 服务信息）
CREATE TABLE aiops.mcp_marketplace_items (
    id BIGSERIAL PRIMARY KEY,
    mcp_id BIGINT UNIQUE NOT NULL,
    creator_user_id BIGINT, -- 创建者用户ID
    category_id BIGINT,
    is_verified BOOLEAN DEFAULT FALSE,
    server_url VARCHAR(500),
    documentation_url VARCHAR(500),
    readme_content TEXT,
    installation_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (mcp_id) REFERENCES aiops.mcp_services (id) ON DELETE CASCADE,
    FOREIGN KEY (creator_user_id) REFERENCES aiops.users (id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES aiops.mcp_categories (id) ON DELETE SET NULL
);

COMMENT ON TABLE aiops.mcp_marketplace_items IS 'MCP 市场项目表，存储市场展示的 MCP 服务信息';

COMMENT ON COLUMN aiops.mcp_marketplace_items.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.mcp_marketplace_items.mcp_id IS 'MCP 服务 ID，外键关联 mcp_services 表';
COMMENT ON COLUMN aiops.mcp_marketplace_items.creator_user_id IS '创建者用户 ID，外键关联 users 表';
COMMENT ON COLUMN aiops.mcp_marketplace_items.category_id IS '分类 ID，外键关联 mcp_categories 表';
COMMENT ON COLUMN aiops.mcp_marketplace_items.is_verified IS '是否已验证';
COMMENT ON COLUMN aiops.mcp_marketplace_items.server_url IS 'mcp 服务URL';
COMMENT ON COLUMN aiops.mcp_marketplace_items.documentation_url IS '文档 URL';
COMMENT ON COLUMN aiops.mcp_marketplace_items.readme_content IS 'README 文档内容（Markdown格式）';
COMMENT ON COLUMN aiops.mcp_marketplace_items.installation_count IS '当前安装次数';
COMMENT ON COLUMN aiops.mcp_marketplace_items.created_at IS '创建时间';
COMMENT ON COLUMN aiops.mcp_marketplace_items.updated_at IS '更新时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mcp_marketplace_category ON aiops.mcp_marketplace_items (category_id);
CREATE INDEX IF NOT EXISTS idx_mcp_marketplace_creator ON aiops.mcp_marketplace_items (creator_user_id);

-- 为相关表创建更新时间戳触发器
CREATE TRIGGER update_mcp_marketplace_items_updated_at BEFORE UPDATE ON aiops.mcp_marketplace_items
    FOR EACH ROW EXECUTE FUNCTION aiops.update_updated_at_column();
