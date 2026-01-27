-- ----------------------------------------------------------------------------
-- 4.1 mcp_services - MCP服务表
-- ----------------------------------------------------------------------------

-- 预先定义枚举类型
CREATE TYPE mcp_transport_type AS ENUM ('stdio', 'sse', 'websocket');
CREATE TYPE mcp_status AS ENUM ('active', 'inactive', 'error', 'maintenance');

-- 表结构
CREATE TABLE mcp_services (
    id BIGSERIAL PRIMARY KEY,
    mcp_id varchar(64) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    version VARCHAR(50),
    transport_type mcp_transport_type NOT NULL,
    connection_config JSONB NOT NULL,
    env_vars JSONB DEFAULT '{}'::jsonb,
    encrypted_auth_info TEXT,
    cached_capabilities JSONB DEFAULT '{}'::jsonb,
    status mcp_status NOT NULL DEFAULT 'inactive',
    last_health_check_at TIMESTAMPTZ,
    health_check_result JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 注释
COMMENT ON TABLE mcp_services IS 'MCP服务表：存储 Model Context Protocol 服务的连接与能力元数据';
COMMENT ON COLUMN mcp_services.id IS '主键：数据库内部使用';
COMMENT ON COLUMN mcp_services.mcp_id IS 'MCP服务ID：唯一标识';
COMMENT ON COLUMN mcp_services.name IS 'MCP服务名称';
COMMENT ON COLUMN mcp_services.description IS 'MCP服务描述';
COMMENT ON COLUMN mcp_services.version IS '服务版本号或协议版本';
COMMENT ON COLUMN mcp_services.transport_type IS '传输类型：stdio (本地进程), sse (服务器发送事件), websocket';
COMMENT ON COLUMN mcp_services.connection_config IS '连接细节：stdio则为 {"command": "...", "args": [...]}; sse则为 {"url": "..."}';
COMMENT ON COLUMN mcp_services.env_vars IS '环境变量：仅用于 stdio 模式，如 {"MY_API_KEY": "xxx"}';
COMMENT ON COLUMN mcp_services.encrypted_auth_info IS '认证凭证：应用层加密后的字符串，数据库层不存明文';
COMMENT ON COLUMN mcp_services.cached_capabilities IS '能力快照：缓存 Tools/Resources 列表，减少握手开销';
COMMENT ON COLUMN mcp_services.status IS '服务状态：active, inactive, error, maintenance';
COMMENT ON COLUMN mcp_services.last_health_check_at IS '最后健康检查时间';
COMMENT ON COLUMN mcp_services.health_check_result IS '健康检查结果';
COMMENT ON COLUMN mcp_services.error_message IS '错误信息：简短的错误描述';
COMMENT ON COLUMN mcp_services.created_at IS '创建时间';
COMMENT ON COLUMN mcp_services.updated_at IS '更新时间';

-- 索引
CREATE INDEX idx_mcp_services_mcp_id ON mcp_services (mcp_id);
CREATE INDEX idx_mcp_services_status ON mcp_services (status);
CREATE INDEX idx_mcp_services_transport ON mcp_services (transport_type);
CREATE INDEX idx_mcp_services_capabilities ON mcp_services USING GIN (cached_capabilities);

-- 触发器
CREATE TRIGGER update_mcp_services_updated_at
    BEFORE UPDATE ON mcp_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
