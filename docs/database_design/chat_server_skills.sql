-- ----------------------------------------------------------------------------
-- 2.4 chat_server_skills - 对话服务技能关联表
-- ----------------------------------------------------------------------------

CREATE TABLE chat_server_skills (
    chat_id VARCHAR(100) NOT NULL,
    skill_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (chat_id, skill_id)
);

COMMENT ON TABLE chat_server_skills IS '对话服务技能关联表：记录对话服务中使用的技能';

COMMENT ON COLUMN chat_server_skills.chat_id IS '对话ID：关联 chat_server.id';

COMMENT ON COLUMN chat_server_skills.skill_id IS '技能ID：关联 skills.id';

COMMENT ON COLUMN chat_server_skills.created_at IS '关联创建时间';

-- Indexes for chat_server_skills
CREATE INDEX idx_chat_server_skills_skill_id ON chat_server_skills (skill_id);