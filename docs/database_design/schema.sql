-- ============================================================================
-- AIOps Platform Database Schema
-- ============================================================================
-- Database: PostgreSQL 16
-- Schema: aiops
-- Version: 1.0.0
-- Date: 2026-01-27
--
-- Description:
--   完整的 AIOps 平台数据库架构，包括 RBAC 权限系统、会话管理、
--   技能库管理、MCP 服务集成和 Agent 配置管理。
--
-- Design Principles:
--   - 所有表使用 BIGINT 自增 ID 作为主键
--   - RBAC 核心表使用外键约束保证数据完整性
--   - 业务表（会话、消息、技能、Agent）不使用外键以提升性能
--   - 使用软删除策略（status + deleted_at）
--   - 使用 JSONB 存储配置数据
-- ----------------------------------------------------------------------------
-- 1.1 users - 用户表
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
        status IN (
            'active',
            'deleted',
            'disabled'
        )
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE users IS '用户表：存储平台用户信息和认证凭据';

COMMENT ON COLUMN users.id IS '主键：数据库内部使用';

COMMENT ON COLUMN users.username IS '用户名：唯一，3-50字符';

COMMENT ON COLUMN users.password_hash IS '加密密码：使用bcrypt';

COMMENT ON COLUMN users.email IS '邮箱：可选，唯一';

COMMENT ON COLUMN users.status IS '状态：active（活跃）, deleted（已删除）, disabled（已禁用）';

COMMENT ON COLUMN users.deleted_at IS '软删除时间：用于30天保留期计算';

-- Indexes for users
CREATE INDEX idx_users_status ON users (status);

CREATE INDEX idx_users_deleted_at ON users (deleted_at)
WHERE
    deleted_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 1.2 roles - 角色表
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE roles IS '角色表：定义用户角色，每个角色包含一组权限';

COMMENT ON COLUMN roles.name IS '角色名称：唯一，如admin, user, guest';

-- ----------------------------------------------------------------------------
-- 1.3 permissions - 权限表
-- ----------------------------------------------------------------------------
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE permissions IS '权限表：定义系统权限，每个权限代表一个可执行的操作';

COMMENT ON COLUMN permissions.name IS '权限名称：格式为{resource}_{action}，如user_create';

COMMENT ON COLUMN permissions.resource IS '资源类型：如user, role, session, skill, agent';

COMMENT ON COLUMN permissions.action IS '操作类型：如create, read, update, delete';

-- Indexes for permissions
CREATE INDEX idx_permissions_resource_action ON permissions (resource, action);

-- ----------------------------------------------------------------------------
-- 1.4 user_roles - 用户角色关联表
-- ----------------------------------------------------------------------------
CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT uniq_user_roles_user_id_role_id UNIQUE (user_id, role_id)
);

COMMENT ON TABLE user_roles IS '用户角色关联表：多对多关系，连接用户和角色';

COMMENT ON COLUMN user_roles.user_id IS '用户ID：外键→users.id';

COMMENT ON COLUMN user_roles.role_id IS '角色ID：外键→roles.id';

-- Indexes for user_roles
CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);

CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);

-- ----------------------------------------------------------------------------
-- 1.5 role_permissions - 角色权限关联表
-- ----------------------------------------------------------------------------
CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
    CONSTRAINT uniq_role_permissions_role_id_permission_id UNIQUE (role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS '角色权限关联表：多对多关系，连接角色和权限';

COMMENT ON COLUMN role_permissions.role_id IS '角色ID：外键→roles.id';

COMMENT ON COLUMN role_permissions.permission_id IS '权限ID：外键→permissions.id';

-- Indexes for role_permissions
CREATE INDEX idx_role_permissions_role_id ON role_permissions (role_id);

CREATE INDEX idx_role_permissions_permission_id ON role_permissions (permission_id);

-- ============================================================================
-- 2. Session & Message Management
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 sessions - 会话表
-- ----------------------------------------------------------------------------

drop table if exists sessions;

CREATE TYPE session_status AS ENUM ('active', 'delete');

CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    user_id BIGINT NOT NULL,
    project_id VARCHAR(255) DEFAULT 'global',
    status session_status NOT NULL DEFAULT 'active',
    opencode_server VARCHAR(120) NOT NULL DEFAULT 'http://127.0.0.1:4096',
    directory VARCHAR(1000),
    agent_ids JSONB DEFAULT '[]'::jsonb,
    mcp_ids JSONB DEFAULT '[]'::jsonb,
    skill_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN sessions.agent_ids IS '关联的 Agent ID 数组（JSONB）：如 [1, 2]';

COMMENT ON COLUMN sessions.mcp_ids IS '关联的 MCP 服务 ID 数组（JSONB）：如 [5]';

COMMENT ON COLUMN sessions.opencode_server IS 'OpenCode 服务器地址：默认为 http://127.0.0.1:4096';

COMMENT ON COLUMN sessions.skill_ids IS '关联的技能 ID 数组（JSONB）：如 [10, 11, 12]';

-- 索引：支持高效的 JSONB 包含查询
CREATE INDEX idx_sessions_agent_ids ON sessions USING GIN (agent_ids);

CREATE INDEX idx_sessions_mcp_ids ON sessions USING GIN (mcp_ids);

CREATE INDEX idx_sessions_skill_ids ON sessions USING GIN (skill_ids);

COMMENT ON TABLE sessions IS '会话表：存储用户与AI的对话会话';

COMMENT ON COLUMN sessions.id IS '主键：数据库内部使用';

COMMENT ON COLUMN sessions.session_id IS '应用层会话ID：唯一，如ses_405cccef1ffeNG8ZWhyAomZ5Mr';

COMMENT ON COLUMN sessions.user_id IS '用户ID：应用层保证引用完整性（无外键约束）';

COMMENT ON COLUMN sessions.project_id IS '项目ID：默认为global';

-- Indexes for sessions
CREATE INDEX idx_sessions_user_id ON sessions (user_id);

CREATE INDEX idx_sessions_updated_at ON sessions (updated_at DESC);

-- ----------------------------------------------------------------------------
-- 2.2 messages - 消息表
-- ----------------------------------------------------------------------------
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (
        role IN ('user', 'assistant', 'system')
    ),
    created_by BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE messages IS '消息表：存储会话中的所有消息';

COMMENT ON COLUMN messages.id IS '主键：数据库内部使用';

COMMENT ON COLUMN messages.session_id IS '会话ID：应用层保证引用完整性（无外键约束）';

COMMENT ON COLUMN messages.content IS '消息内容：TEXT类型';

COMMENT ON COLUMN messages.role IS '消息角色：user（用户）, assistant（AI助手）, system（系统）';

COMMENT ON COLUMN messages.created_by IS '创建人ID：user角色时为用户ID';

-- Indexes for messages
CREATE INDEX idx_messages_session_id ON messages (session_id);

CREATE INDEX idx_messages_created_at ON messages (created_at DESC);

CREATE INDEX idx_messages_session_id_created_at ON messages (session_id, created_at DESC);

-- ============================================================================
-- 3. Skills Management
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 skills - 技能表
-- ----------------------------------------------------------------------------



-- ============================================================================
-- 4. MCP Services Management
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 mcp_services - MCP服务表
-- ----------------------------------------------------------------------------
-- 0. 预先定义枚举类型 (如果尚未定义)
CREATE TYPE mcp_transport_type AS ENUM ('stdio', 'sse', 'websocket');

CREATE TYPE mcp_status AS ENUM ('active', 'inactive', 'error', 'maintenance');

-- 1. 表结构优化
CREATE TABLE mcp_services (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    version VARCHAR(50), -- 记录服务版本号或协议版本
    transport_type mcp_transport_type NOT NULL, -- 显式区分传输方式
    connection_config JSONB NOT NULL, -- 重命名为 config，存储 cmd, args, url 等
    env_vars JSONB DEFAULT '{}'::jsonb, -- 专用于 stdio 模式的环境变量配置
    encrypted_auth_info TEXT, -- 建议用 TEXT 存储加密后的 Base64 字符串，而非 JSONB
    cached_capabilities JSONB DEFAULT '{}'::jsonb,
    status mcp_status NOT NULL DEFAULT 'inactive',
    last_health_check_at TIMESTAMPTZ,
    health_check_result JSONB,
    error_message TEXT, -- 专门记录简短的错误信息，方便列表展示
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 注释完善
COMMENT ON TABLE mcp_services IS 'MCP服务表：存储 Model Context Protocol 服务的连接与能力元数据';

COMMENT ON COLUMN mcp_services.transport_type IS '传输类型：stdio (本地进程), sse (服务器发送事件), websocket';

COMMENT ON COLUMN mcp_services.connection_config IS '连接细节：stdio则为 {"command": "...", "args": [...]}; sse则为 {"url": "..."}';

COMMENT ON COLUMN mcp_services.env_vars IS '环境变量：仅用于 stdio 模式，如 {"MY_API_KEY": "xxx"}';

COMMENT ON COLUMN mcp_services.encrypted_auth_info IS '认证凭证：应用层加密后的字符串，数据库层不存明文';

COMMENT ON COLUMN mcp_services.cached_capabilities IS '能力快照：缓存 Tools/Resources 列表，减少握手开销';

-- 3. 索引优化
CREATE INDEX idx_mcp_services_status ON mcp_services (status);

CREATE INDEX idx_mcp_services_transport ON mcp_services (transport_type);
-- 如果经常需要查询提供特定工具的服务，可以对 capabilities 建 GIN 索引
CREATE INDEX idx_mcp_services_capabilities ON mcp_services USING GIN (cached_capabilities);

-- 4. 自动更新 updated_at 的触发器 (推荐)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS 
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$
 language 'plpgsql';

CREATE TRIGGER update_mcp_services_updated_at
    BEFORE UPDATE ON mcp_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. Agents Management
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1 agents - Agent表
-- ----------------------------------------------------------------------------
CREATE TYPE agent_mode AS ENUM ('primary', 'subagent', 'all');

CREATE TABLE agents (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    temperature DECIMAL(3, 2) CHECK (
        temperature >= 0
        AND temperature <= 1
    ),
    max_steps INTEGER CHECK (max_steps >= 1),
    system_prompt TEXT,
    tools_permissions JSONB,
    action_permissions JSONB,
    mode agent_mode NOT NULL DEFAULT 'all',
    model VARCHAR(255),
    additional_params JSONB,
    config_content TEXT,
    disabled BOOLEAN NOT NULL DEFAULT FALSE,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by BIGINT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_by BIGINT,
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE agents IS 'Agent表：存储OpenCode Agent的配置信息';

COMMENT ON COLUMN agents.id IS '主键：数据库内部使用';

COMMENT ON COLUMN agents.name IS 'Agent名称：唯一';

COMMENT ON COLUMN agents.temperature IS '温度参数：0.0-1.0，控制LLM响应的随机性';

COMMENT ON COLUMN agents.max_steps IS '最大步数限制：控制Agent迭代次数';

COMMENT ON COLUMN agents.system_prompt IS '系统提示词：自定义系统提示词内容';

COMMENT ON COLUMN agents.tools_permissions IS '工具权限配置：JSONB格式';

COMMENT ON COLUMN agents.action_permissions IS '操作权限配置：JSONB格式';

COMMENT ON COLUMN agents.mode IS '模式：primary（主代理）, subagent（子代理）, all（全局可用）';

COMMENT ON COLUMN agents.model IS '覆盖的模型：如anthropic/claude-haiku-4-20250514';

COMMENT ON COLUMN agents.additional_params IS '服务商特定参数：JSONB格式';

COMMENT ON COLUMN agents.config_content IS '配置文件内容：Markdown格式（TEXT类型）';

COMMENT ON COLUMN agents.disabled IS '是否禁用：true表示Agent不可用';

COMMENT ON COLUMN agents.hidden IS '是否隐藏：是否在菜单中隐藏（仅子代理）';

COMMENT ON COLUMN agents.created_by IS '创建人ID：应用层保证引用完整性（无外键约束）';

-- Indexes for agents
CREATE INDEX idx_agents_mode ON agents (mode);

CREATE INDEX idx_agents_disabled ON agents (disabled);

-- ============================================================================
-- Trigger: Updated At
-- ============================================================================
-- 自动更新 updated_at 字段的触发器函数

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表创建触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at
    BEFORE UPDATE ON skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_services_updated_at
    BEFORE UPDATE ON mcp_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();