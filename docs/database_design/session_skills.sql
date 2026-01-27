-- ----------------------------------------------------------------------------
-- 2.4 session_skills - 会话技能关联表
-- ----------------------------------------------------------------------------

CREATE TABLE session_skills (
    session_id VARCHAR(100) NOT NULL,
    skill_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (session_id, skill_id)
);

COMMENT ON TABLE session_skills IS '会话技能关联表：记录会话中使用的技能';
COMMENT ON COLUMN session_skills.session_id IS '会话ID：关联 sessions.session_id';
COMMENT ON COLUMN session_skills.skill_id IS '技能ID：关联 skills.skill_id';
COMMENT ON COLUMN session_skills.created_at IS '关联创建时间';

-- Indexes for session_skills
CREATE INDEX idx_session_skills_skill_id ON session_skills (skill_id);
