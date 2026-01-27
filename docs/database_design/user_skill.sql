DROP TABLE IF EXISTS user_skill;

CREATE TABLE user_skill (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    skill_id VARCHAR(64) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_user_skill_session UNIQUE (user_id, skill_id, session_id)
);

-- 表和字段注释
COMMENT ON TABLE user_skill IS '用户技能关联表：记录用户在特定会话中使用的技能';
COMMENT ON COLUMN user_skill.id IS '主键：数据库内部使用';
COMMENT ON COLUMN user_skill.user_id IS '用户ID：关联用户表';
COMMENT ON COLUMN user_skill.skill_id IS '技能ID：关联 skills 表中的 skill_id';
COMMENT ON COLUMN user_skill.session_id IS '会话ID：关联 session 表中的 session_id';
COMMENT ON COLUMN user_skill.sort_order IS '排序值：用于页面显示卡片排序，数字越小越靠前';
COMMENT ON COLUMN user_skill.created_at IS '创建时间：记录条目写入时间';
-- 索引
CREATE INDEX idx_user_skill_user_id ON user_skill (user_id);
CREATE INDEX idx_user_skill_skill_id ON user_skill (skill_id);
CREATE INDEX idx_user_skill_session_id ON user_skill (session_id);
CREATE INDEX idx_user_skill_sort_order ON user_skill (user_id, session_id, sort_order);