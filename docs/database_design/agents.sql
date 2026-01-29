-- ----------------------------------------------------------------------------
-- 5.1 agents - Agent表
-- ----------------------------------------------------------------------------

CREATE TYPE aiops.agent_mode AS ENUM ('primary', 'subagent', 'all');

CREATE TABLE aiops.agents (
    id BIGSERIAL PRIMARY KEY,
    agent_id varchar(64) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL UNIQUE,
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

-- 表注释
COMMENT ON TABLE aiops.agents IS 'Agent表：存储OpenCode Agent的配置信息';

-- 字段注释
COMMENT ON COLUMN aiops.agents.id IS '主键：数据库内部使用';

COMMENT ON COLUMN aiops.agents.agent_id IS 'AgentID：唯一标识';

COMMENT ON COLUMN aiops.agents.name IS 'Agent名称：唯一';

COMMENT ON COLUMN aiops.agents.description IS 'Agent描述';

COMMENT ON COLUMN aiops.agents.temperature IS '温度参数：0.0-1.0，控制LLM响应的随机性';

COMMENT ON COLUMN aiops.agents.max_steps IS '最大步数限制：控制Agent迭代次数';

COMMENT ON COLUMN aiops.agents.system_prompt IS '系统提示词：自定义系统提示词内容';

COMMENT ON COLUMN aiops.agents.tools_permissions IS '工具权限配置：JSONB格式';

COMMENT ON COLUMN aiops.agents.action_permissions IS '操作权限配置：JSONB格式';

COMMENT ON COLUMN aiops.agents.mode IS '模式：primary（主代理）, subagent（子代理）, all（全局可用）';

COMMENT ON COLUMN aiops.agents.model IS '覆盖的模型：如anthropic/claude-haiku-4-20250514';

COMMENT ON COLUMN aiops.agents.additional_params IS '服务商特定参数：JSONB格式';

COMMENT ON COLUMN aiops.agents.config_content IS '配置文件内容：Markdown格式（TEXT类型）';

COMMENT ON COLUMN aiops.agents.disabled IS '是否禁用：true表示Agent不可用';

COMMENT ON COLUMN aiops.agents.hidden IS '是否隐藏：是否在菜单中隐藏（仅子代理）';

COMMENT ON COLUMN aiops.agents.created_by IS '创建人ID：应用层保证引用完整性（无外键约束）';

COMMENT ON COLUMN aiops.agents.created_at IS '创建时间';

COMMENT ON COLUMN aiops.agents.updated_by IS '更新人ID';

COMMENT ON COLUMN aiops.agents.updated_at IS '更新时间';

COMMENT ON COLUMN aiops.agents.deleted_by IS '删除人ID';

COMMENT ON COLUMN aiops.agents.deleted_at IS '删除时间';

-- Indexes for agents
CREATE INDEX idx_agents_mode ON aiops.agents (mode);

CREATE INDEX idx_agents_disabled ON aiops.agents (disabled);

-- Trigger for updated_at
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();