drop table if exists aiops.skills;

CREATE TYPE aiops.skill_status AS ENUM ('active', 'disabled');

CREATE TABLE aiops.skills (
    id BIGSERIAL PRIMARY KEY,
    skill_id VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    tags VARCHAR(180) [],
    status skill_status NOT NULL DEFAULT 'active',
    sort_order INTEGER NOT NULL DEFAULT 0,
    file_path VARCHAR(255) NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by BIGINT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表注释
COMMENT ON TABLE aiops.skills IS '技能表：存储平台可用的AI技能信息';

-- 字段注释
COMMENT ON COLUMN aiops.skills.id IS '主键：数据库内部使用';

COMMENT ON COLUMN aiops.skills.skill_id IS '技能ID：唯一标识一个技能';

COMMENT ON COLUMN aiops.skills.name IS '技能名称';

COMMENT ON COLUMN aiops.skills.description IS '技能描述';

COMMENT ON COLUMN aiops.skills.icon IS '图标样式';

COMMENT ON COLUMN aiops.skills.category IS '技能分类：如code-analysis, data-processing';

COMMENT ON COLUMN aiops.skills.tags IS '技能标签数组：PostgreSQL数组类型';

COMMENT ON COLUMN aiops.skills.status IS '状态：active（启用）, disabled（禁用）';

COMMENT ON COLUMN aiops.skills.sort_order IS '排序值：数字越小越靠前';

COMMENT ON COLUMN aiops.skills.file_path IS '技能压缩包文件路径';

COMMENT ON COLUMN aiops.skills.created_by IS '创建人ID：应用层保证引用完整性（无外键约束）';

COMMENT ON COLUMN aiops.skills.created_at IS '创建时间';

COMMENT ON COLUMN aiops.skills.updated_by IS '更新人ID';

COMMENT ON COLUMN aiops.skills.updated_at IS '更新时间';

-- Indexes for skills
CREATE INDEX idx_skills_name ON aiops.skills (name);

CREATE INDEX idx_skills_category ON aiops.skills (category);

CREATE INDEX idx_skills_status ON aiops.skills (status);

CREATE INDEX idx_skills_sort_order ON aiops.skills (sort_order);

CREATE INDEX idx_skills_tags ON aiops.skills USING GIN (tags);

CREATE INDEX idx_skills_category_status_order ON aiops.skills (category, status, sort_order);

CREATE TRIGGER update_skills_updated_at
    BEFORE UPDATE ON aiops.skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();