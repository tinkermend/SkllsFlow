-- Active: 1769677791565@@127.0.0.1@5432@aiops@aiops
-- ============================================
-- MCP 分类表
-- ============================================

-- MCP 分类表
CREATE TABLE IF NOT EXISTS aiops.mcp_categories (
    id BIGSERIAL PRIMARY KEY,
    category_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (
        status IN ('active', 'disabled')
    ),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE aiops.mcp_categories IS 'MCP 分类表，用于 MCP 市场分类管理';

COMMENT ON COLUMN aiops.mcp_categories.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.mcp_categories.category_id IS '分类唯一标识符';
COMMENT ON COLUMN aiops.mcp_categories.name IS '分类名称';
COMMENT ON COLUMN aiops.mcp_categories.description IS '分类描述';
COMMENT ON COLUMN aiops.mcp_categories.icon IS '分类图标';
COMMENT ON COLUMN aiops.mcp_categories.sort_order IS '排序权重，数值越小越靠前';
COMMENT ON COLUMN aiops.mcp_categories.status IS '状态：active(激活)、disabled(禁用)';
COMMENT ON COLUMN aiops.mcp_categories.created_at IS '创建时间';
COMMENT ON COLUMN aiops.mcp_categories.updated_at IS '更新时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mcp_categories_status ON aiops.mcp_categories (status);
CREATE INDEX IF NOT EXISTS idx_mcp_categories_sort ON aiops.mcp_categories (sort_order);

-- 创建触发器函数更新时间戳
CREATE OR REPLACE FUNCTION aiops.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表创建更新时间戳触发器
CREATE TRIGGER update_mcp_categories_updated_at BEFORE UPDATE ON aiops.mcp_categories
    FOR EACH ROW EXECUTE FUNCTION aiops.update_updated_at_column();

-- 插入默认分类数据
INSERT INTO
    aiops.mcp_categories (
        category_id,
        name,
        description,
        icon,
        sort_order
    )
VALUES (
        'search',
        '搜索工具',
        '搜索引擎和数据检索工具',
        'search',
        1
    ),
    (
        'database',
        '数据库',
        '数据库连接和查询工具',
        'database',
        2
    ),
    (
        'productivity',
        '生产力',
        '办公和效率提升工具',
        'briefcase',
        3
    ),
    (
        'devtools',
        '开发工具',
        '软件开发和调试工具',
        'code',
        4
    ),
    (
        'communication',
        '通信',
        '消息传递和通信工具',
        'message-circle',
        5
    ),
    (
        'ai-ml',
        'AI/ML',
        '人工智能和机器学习工具',
        'brain',
        6
    ),
    (
        'storage',
        '存储',
        '文件存储和管理工具',
        'folder-open',
        7
    ),
    (
        'monitoring',
        '监控',
        '系统监控和日志工具',
        'activity',
        8
    ),
    (
        'security',
        '安全',
        '安全认证和加密工具',
        'shield',
        9
    ),
    (
        'other',
        '其他',
        '其他未分类工具',
        'more-horizontal',
        99
    )
ON CONFLICT (category_id) DO NOTHING;
