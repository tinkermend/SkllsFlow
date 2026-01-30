-- Active: 1769677791565@@127.0.0.1@5432@aiops@aiops
-- ============================================
-- MCP 管理数据库表结构
-- 基于 PostgreSQL 设计
-- ============================================

-- MCP 服务主表（扩展现有 mcp_services 表）
COMMENT ON TABLE aiops.mcp_services IS 'MCP 服务表，存储 Model Context Protocol 服务的连接与能力元数据';

-- MCP 分类表
CREATE TABLE aiops.mcp_categories (
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

-- MCP 标签表
CREATE TABLE aiops.mcp_tags (
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

-- MCP 服务标签关联表
CREATE TABLE aiops.mcp_service_tags (
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

-- MCP 工具定义表
CREATE TABLE aiops.mcp_tools (
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

-- MCP 资源定义表
CREATE TABLE aiops.mcp_resources (
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

drop table if exists aiops.mcp_marketplace_items;
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

-- 扩展 mcp_services 表的字段
ALTER TABLE aiops.mcp_services
ADD COLUMN IF NOT EXISTS category_id BIGINT,
ADD COLUMN IF NOT EXISTS icon VARCHAR(200),
ADD COLUMN IF NOT EXISTS language VARCHAR(50), -- Python, Node.js, Go, Other
ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT;

-- 为 mcp_services 扩展字段添加注释
COMMENT ON COLUMN aiops.mcp_services.category_id IS '分类 ID，外键关联 mcp_categories 表';

COMMENT ON COLUMN aiops.mcp_services.icon IS '图标（emoji 或 URL）';

COMMENT ON COLUMN aiops.mcp_services.language IS '开发语言：python/javascript/go/other';

COMMENT ON COLUMN aiops.mcp_services.created_by_user_id IS '创建者用户 ID，关联 users 表';

-- 添加外键约束


-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mcp_categories_status ON aiops.mcp_categories (status);

CREATE INDEX IF NOT EXISTS idx_mcp_categories_sort ON aiops.mcp_categories (sort_order);

CREATE INDEX IF NOT EXISTS idx_mcp_services_category ON aiops.mcp_services (category_id);

CREATE INDEX IF NOT EXISTS idx_mcp_services_creator ON aiops.mcp_services (created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_mcp_services_language ON aiops.mcp_services (language);

CREATE INDEX IF NOT EXISTS idx_mcp_tools_mcp_id ON aiops.mcp_tools (mcp_id);

CREATE INDEX IF NOT EXISTS idx_mcp_resources_mcp_id ON aiops.mcp_resources (mcp_id);

CREATE INDEX IF NOT EXISTS idx_mcp_service_tags_mcp_id ON aiops.mcp_service_tags (mcp_id);

CREATE INDEX IF NOT EXISTS idx_mcp_service_tags_tag_id ON aiops.mcp_service_tags (tag_id);

CREATE INDEX IF NOT EXISTS idx_mcp_marketplace_category ON aiops.mcp_marketplace_items (category_id);

CREATE INDEX IF NOT EXISTS idx_mcp_marketplace_creator ON aiops.mcp_marketplace_items (creator_user_id);


-- 为相关表创建更新时间戳触发器
CREATE TRIGGER update_mcp_categories_updated_at BEFORE UPDATE ON aiops.mcp_categories
    FOR EACH ROW EXECUTE FUNCTION aiops.update_updated_at_column();

CREATE TRIGGER update_mcp_marketplace_items_updated_at BEFORE UPDATE ON aiops.mcp_marketplace_items
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
    );

-- 插入默认标签
INSERT INTO
    aiops.mcp_tags (name, color)
VALUES ('主机', '#3b82f6'),
    ('测试版', '#f97316'),
    ('稳定版', '#10b981'),
    ('中间件', '#4285f4'),
    ('缓存与消息', '#00a1f1'),
    ('应用服务', '#ff9900'),
    ('数据库', '#ef4444');