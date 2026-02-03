-- 移除 sessions 表的外键约束
-- 数据一致性改为由应用层保证

-- 删除 chat_id 外键约束
ALTER TABLE aiops.sessions DROP CONSTRAINT IF EXISTS sessions_chat_id_fkey;

-- 删除 created_by 外键约束
ALTER TABLE aiops.sessions DROP CONSTRAINT IF EXISTS sessions_created_by_fkey;

-- 注意：索引保留不变
-- idx_sessions_chat_id
-- idx_sessions_created_by
-- idx_sessions_created_by_chat_id
