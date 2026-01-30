-- Active: 1769677791565@@127.0.0.1@5432@aiops@aiops
-- ============================================
-- MCP 服务表
-- ============================================

-- 创建 MCP 传输类型枚举
DO $$ BEGIN
    CREATE TYPE aiops.mcp_transport_type AS ENUM ('stdio', 'sse', 'websocket');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建 MCP 状态枚举
DO $$ BEGIN
    CREATE TYPE aiops.mcp_status AS ENUM ('active', 'inactive', 'error', 'maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- MCP 服务表
CREATE TABLE IF NOT EXISTS aiops.mcp_services (
    id BIGSERIAL PRIMARY KEY,
    mcp_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    version VARCHAR(50),
    transport_type aiops.mcp_transport_type NOT NULL,
    connection_config JSONB NOT NULL,
    env_vars JSONB DEFAULT '{}',
    encrypted_auth_info TEXT,
    cached_capabilities JSONB DEFAULT '{}',
    status aiops.mcp_status DEFAULT 'inactive',
    last_health_check_at TIMESTAMP,
    health_check_result JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- 扩展字段
    category_id BIGINT,
    icon VARCHAR(200),
    language VARCHAR(50),
    created_by_user_id BIGINT
);

COMMENT ON TABLE aiops.mcp_services IS 'MCP 服务表，存储 Model Context Protocol 服务的连接与能力元数据';

-- 基础字段注释
COMMENT ON COLUMN aiops.mcp_services.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.mcp_services.mcp_id IS 'MCP 服务唯一标识符';
COMMENT ON COLUMN aiops.mcp_services.name IS 'MCP 服务名称，唯一';
COMMENT ON COLUMN aiops.mcp_services.description IS 'MCP 服务描述说明';
COMMENT ON COLUMN aiops.mcp_services.version IS '服务版本号或协议版本';
COMMENT ON COLUMN aiops.mcp_services.transport_type IS '传输类型：stdio（本地进程）、sse（服务器发送事件）、websocket';
COMMENT ON COLUMN aiops.mcp_services.connection_config IS '连接细节，JSONB 格式';
COMMENT ON COLUMN aiops.mcp_services.env_vars IS '环境变量，仅用于 stdio 模式';
COMMENT ON COLUMN aiops.mcp_services.encrypted_auth_info IS '认证凭证，应用层加密后的字符串';
COMMENT ON COLUMN aiops.mcp_services.cached_capabilities IS '能力快照，缓存 Tools/Resources 列表';
COMMENT ON COLUMN aiops.mcp_services.status IS '服务状态：active、inactive、error、maintenance';
COMMENT ON COLUMN aiops.mcp_services.last_health_check_at IS '最后健康检查时间';
COMMENT ON COLUMN aiops.mcp_services.health_check_result IS '健康检查结果，JSONB 格式';
COMMENT ON COLUMN aiops.mcp_services.error_message IS '错误信息，简短的错误描述';
COMMENT ON COLUMN aiops.mcp_services.created_at IS '创建时间';
COMMENT ON COLUMN aiops.mcp_services.updated_at IS '更新时间';

-- 扩展字段注释
COMMENT ON COLUMN aiops.mcp_services.category_id IS '分类 ID，外键关联 mcp_categories 表';
COMMENT ON COLUMN aiops.mcp_services.icon IS '图标（emoji 或 URL）';
COMMENT ON COLUMN aiops.mcp_services.language IS '开发语言：python/javascript/go/other';
COMMENT ON COLUMN aiops.mcp_services.created_by_user_id IS '创建者用户 ID，关联 users 表';

-- 添加外键约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_mcp_services_category'
    ) THEN
        ALTER TABLE aiops.mcp_services
        ADD CONSTRAINT fk_mcp_services_category
        FOREIGN KEY (category_id) REFERENCES aiops.mcp_categories(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_mcp_services_creator'
    ) THEN
        ALTER TABLE aiops.mcp_services
        ADD CONSTRAINT fk_mcp_services_creator
        FOREIGN KEY (created_by_user_id) REFERENCES aiops.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mcp_services_mcp_id ON aiops.mcp_services (mcp_id);
CREATE INDEX IF NOT EXISTS idx_mcp_services_status ON aiops.mcp_services (status);
CREATE INDEX IF NOT EXISTS idx_mcp_services_transport_type ON aiops.mcp_services (transport_type);
CREATE INDEX IF NOT EXISTS idx_mcp_services_category ON aiops.mcp_services (category_id);
CREATE INDEX IF NOT EXISTS idx_mcp_services_creator ON aiops.mcp_services (created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_services_language ON aiops.mcp_services (language);
