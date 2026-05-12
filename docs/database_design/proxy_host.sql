-- ============================================================================
-- proxy_host 表设计
-- ============================================================================
-- 用途：存储部署了代理程序的服务器信息
-- 作者：SkllsFlow Team
-- ============================================================================
CREATE TABLE IF NOT EXISTS proxy_host (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    region TEXT,
    -- 网络配置
    host varchar(64) NOT NULL,
    port INTEGER NOT NULL,
    begin_chat_port INTEGER NOT NULL DEFAULT 4000,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
        status IN (
            'active',
            'disabled',
            'maintenance'
        )
    ),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by bigint NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_by bigint
);

COMMENT ON TABLE proxy_host IS '代理服务器主机信息表，存储可用于启动 OpenCode Server 的代理节点';

COMMENT ON COLUMN proxy_host.id IS '自增主键';

COMMENT ON COLUMN proxy_host.name IS '代理服务器名称';

COMMENT ON COLUMN proxy_host.description IS '代理服务器描述信息';

COMMENT ON COLUMN proxy_host.host IS '代理服务器 IP 地址';

COMMENT ON COLUMN proxy_host.port IS '代理服务端口';

COMMENT ON COLUMN proxy_host.begin_chat_port IS '默认对话服务起始端口';

COMMENT ON COLUMN proxy_host.region IS '服务器所在区域/地理位置';

COMMENT ON COLUMN proxy_host.status IS '代理状态：active-可用, disabled-已禁用, maintenance-维护中';

COMMENT ON COLUMN proxy_host.created_at IS '创建时间';

COMMENT ON COLUMN proxy_host.created_by IS '创建人 ID（关联 users.id 表）';

COMMENT ON COLUMN proxy_host.updated_at IS '更新时间';

COMMENT ON COLUMN proxy_host.updated_by IS '更新人（关联 users 表）';




