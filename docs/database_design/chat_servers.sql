-- ============================================================================
-- chat_servers 表设计
-- ============================================================================
-- 用途：存储启动的 OpenCode Server 信息
-- 作者：SkllsFlow Team
-- 创建时间：2026-02-01
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_servers (
    id BIGSERIAL PRIMARY KEY,
    chat_id UUID NOT NULL DEFAULT gen_random_uuid (),
    name VARCHAR(120) NOT NULL,
    chat_dir TEXT NOT NULL,
    proxy_id BIGINT NOT NULL,
    host varchar(32) NOT NULL,
    port INTEGER NOT NULL,
    auth BOOLEAN NOT NULL DEFAULT false,
    auth_password varchar(32) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'disabled', 'error')
    ),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by bigint NOT NULL,
    CONSTRAINT chat_servers_chat_id_unique UNIQUE (chat_id),
    CONSTRAINT chat_servers_host_port_unique UNIQUE (host, port),
    CONSTRAINT chat_servers_port_range CHECK (
        port > 0
        AND port <= 65535
    )
);

-- ============================================================================
-- 索引设计
-- ============================================================================

-- 主键索引（自动创建）
-- CREATE UNIQUE INDEX idx_chat_servers_pkey ON chat_servers(id);

-- chat_id 唯一索引（已通过 UNIQUE 约束创建）
-- 复合索引：proxy_id + status（用于查询某个 proxy 下活跃的 servers）
CREATE INDEX idx_chat_servers_proxy_status ON chat_servers (proxy_id, status);

-- created_by 索引（用于查询某个用户创建的 servers）
CREATE INDEX idx_chat_servers_created_by ON chat_servers (created_by);

COMMENT ON TABLE chat_servers IS 'OpenCode Server 信息表，存储启动的对话服务器实例';

COMMENT ON COLUMN chat_servers.id IS '自增主键';

COMMENT ON COLUMN chat_servers.chat_id IS '对话唯一标识符（UUID）';

COMMENT ON COLUMN chat_servers.name IS '对话名称';

COMMENT ON COLUMN chat_servers.chat_dir IS 'OpenCode Server 启动目录';

COMMENT ON COLUMN chat_servers.proxy_id IS '关联的代理服务器 ID';

COMMENT ON COLUMN chat_servers.host IS 'Server 监听 IP 地址';

COMMENT ON COLUMN chat_servers.port IS 'Server 监听端口';

COMMENT ON COLUMN chat_servers.auth IS '是否启用认证';

COMMENT ON COLUMN chat_servers.auth_password IS '认证密码（当 auth 为 true 时有效）';

COMMENT ON COLUMN chat_servers.status IS 'Server 状态：active-活跃, disabled-已禁用,error-错误';

COMMENT ON COLUMN chat_servers.error_message IS '错误信息（当 status 为 error 时记录具体错误）';

COMMENT ON COLUMN chat_servers.created_at IS '创建时间';

COMMENT ON COLUMN chat_servers.created_by IS '创建人ID（关联 users 表id 字段）';