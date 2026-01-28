-- Active: 1769452445328@@127.0.0.1@5432@aiops
-- 在 aiops schema 下创建 session_status enum
-- 用于支持 Prisma 使用 schema=aiops

-- 创建 aiops schema（如果不存在）
CREATE SCHEMA IF NOT EXISTS aiops;

-- 删除旧的 enum（如果存在）
DROP TYPE IF EXISTS aiops.session_status;

-- 在 aiops schema 下创建 enum
CREATE TYPE aiops.session_status AS ENUM ('active', 'delete');

-- 验证 enum 创建成功
SELECT n.nspname as schema_name,
       t.typname as enum_name,
       e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname = 'session_status'
  AND n.nspname = 'aiops';
