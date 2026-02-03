-- Active: 1770086534756@@127.0.0.1@5432@aiops@aiops
-- Refactor skills table: remove file_path column
-- Add skill_files table for storing skill ZIP files

-- Step 1: Remove file_path column from skills table
ALTER TABLE "aiops"."skills"
DROP COLUMN IF EXISTS "file_path";

-- Step 2: Create skill_files table
CREATE TABLE IF NOT EXISTS "aiops"."skill_files" (
    "id" BIGSERIAL PRIMARY KEY,
    "skill_id" BIGINT NOT NULL,
    "file_data" BYTEA NOT NULL,
    "file_name" VARCHAR(120) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL DEFAULT 'application/zip',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Add indexes
CREATE INDEX IF NOT EXISTS "idx_skill_files_skill_id" ON "aiops"."skill_files"("skill_id");
CREATE INDEX IF NOT EXISTS "idx_skill_files_created_at" ON "aiops"."skill_files"("created_at");

-- Step 4: Add comments
COMMENT ON TABLE "aiops"."skill_files" IS '技能二进制文件存储表：存储技能上传的zip文件内容';
COMMENT ON COLUMN "aiops"."skill_files"."id" IS '主键：自增ID';
COMMENT ON COLUMN "aiops"."skill_files"."skill_id" IS '技能ID：关联skills表的id字段（应用层保证引用完整性）';
COMMENT ON COLUMN "aiops"."skill_files"."file_data" IS 'ZIP文件内容：二进制数据';
COMMENT ON COLUMN "aiops"."skill_files"."file_name" IS 'ZIP文件名称：原始文件名';
COMMENT ON COLUMN "aiops"."skill_files"."file_size" IS 'ZIP文件大小：字节数';
COMMENT ON COLUMN "aiops"."skill_files"."mime_type" IS 'MIME类型：默认为application/zip';
COMMENT ON COLUMN "aiops"."skill_files"."created_at" IS '创建时间：文件上传时间';
