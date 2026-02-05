-- Active: 1769677791565@@127.0.0.1@5432@aiops@aiops
DROP TABLE IF EXISTS user_skills;

CREATE TABLE user_skills (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    skill_id VARCHAR(64) NOT NULL,
    chat_id BIGINT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_user_skills_chat UNIQUE (user_id, skill_id, chat_id)
);

-- 表和字段注释
COMMENT ON TABLE user_skills IS '用户技能关联表：记录用户在特定聊天服务中使用的技能';
COMMENT ON COLUMN user_skills.id IS '主键：数据库内部使用';
COMMENT ON COLUMN user_skills.user_id IS '用户ID：关联用户表';
COMMENT ON COLUMN user_skills.skill_id IS '技能ID：关联 skills 表中的 skill_id';
COMMENT ON COLUMN user_skills.chat_id IS '聊天服务ID：关联 chat_servers 表中的 id，由应用层保证一致性（无外键约束）';
COMMENT ON COLUMN user_skills.sort_order IS '排序值：用于页面显示卡片排序，数字越小越靠前';
COMMENT ON COLUMN user_skills.created_at IS '创建时间：记录条目写入时间';

-- 索引
CREATE INDEX idx_user_skills_user_id ON user_skills (user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills (skill_id);
CREATE INDEX idx_user_skills_chat_id ON user_skills (chat_id);
CREATE INDEX idx_user_skills_sort_order ON user_skills (user_id, chat_id, sort_order);

-- 注意：不添加外键约束，数据一致性由应用层保证
-- 这样可以避免级联删除和循环依赖问题