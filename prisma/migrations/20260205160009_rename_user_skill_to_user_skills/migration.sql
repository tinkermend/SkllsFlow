-- 重命名表：user_skill -> user_skills
ALTER TABLE "aiops"."user_skill" RENAME TO "user_skills";

-- 添加新列 chat_id (BIGINT)
ALTER TABLE "aiops"."user_skills"
ADD COLUMN "chat_id" BIGINT;

-- 从 sessions 表回填 chat_id 数据
UPDATE "aiops"."user_skills" AS us
SET "chat_id" = s."chat_id"
FROM "aiops"."sessions" AS s
WHERE us."session_id" = s."session_id";

-- 设置 chat_id 为 NOT NULL
ALTER TABLE "aiops"."user_skills"
ALTER COLUMN "chat_id" SET NOT NULL;

-- 删除旧的 session_id 列
ALTER TABLE "aiops"."user_skills"
DROP COLUMN "session_id";

-- 删除旧的唯一约束
ALTER TABLE "aiops"."user_skills"
DROP CONSTRAINT IF EXISTS "uk_user_skill_session";

-- 添加新的唯一约束
ALTER TABLE "aiops"."user_skills"
ADD CONSTRAINT "uk_user_skills_chat" UNIQUE ("user_id", "skill_id", "chat_id");

-- 删除旧索引
DROP INDEX IF EXISTS "aiops"."idx_user_skill_user_id";
DROP INDEX IF EXISTS "aiops"."idx_user_skill_skill_id";
DROP INDEX IF EXISTS "aiops"."idx_user_skill_session_id";
DROP INDEX IF EXISTS "aiops"."idx_user_skill_sort_order";

-- 创建新索引
CREATE INDEX "idx_user_skills_user_id" ON "aiops"."user_skills" ("user_id");
CREATE INDEX "idx_user_skills_skill_id" ON "aiops"."user_skills" ("skill_id");
CREATE INDEX "idx_user_skills_chat_id" ON "aiops"."user_skills" ("chat_id");
CREATE INDEX "idx_user_skills_sort_order" ON "aiops"."user_skills" ("user_id", "chat_id", "sort_order");

-- 注意：不添加外键约束，数据一致性由应用层保证
-- 这样可以避免级联删除和循环依赖问题

-- 更新表注释
COMMENT ON TABLE "aiops"."user_skills" IS '用户技能关联表：记录用户在特定聊天服务中使用的技能';
COMMENT ON COLUMN "aiops"."user_skills"."chat_id" IS '聊天服务ID：关联 chat_servers 表中的 id，由应用层保证一致性（无外键约束）';
