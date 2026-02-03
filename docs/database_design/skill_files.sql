-- 删除已存在的表
DROP TABLE IF EXISTS aiops.skill_files;

-- 创建技能文件存储表
CREATE TABLE aiops.skill_files (
    id BIGSERIAL PRIMARY KEY,
    skill_id BIGINT NOT NULL,
    file_data BYTEA NOT NULL,
    file_name VARCHAR(120) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'application/zip',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 表注释
COMMENT ON TABLE aiops.skill_files IS '技能二进制文件存储表：存储技能上传的zip文件内容';

-- 字段注释
COMMENT ON COLUMN aiops.skill_files.id IS '主键：自增ID';

COMMENT ON COLUMN aiops.skill_files.skill_id IS '技能ID：关联skills表的id字段（应用层保证引用完整性）';

COMMENT ON COLUMN aiops.skill_files.file_data IS 'ZIP文件内容：二进制数据';

COMMENT ON COLUMN aiops.skill_files.file_name IS 'ZIP文件名称：原始文件名';

COMMENT ON COLUMN aiops.skill_files.file_size IS 'ZIP文件大小：字节数';

COMMENT ON COLUMN aiops.skill_files.mime_type IS 'MIME类型：默认为application/zip';

COMMENT ON COLUMN aiops.skill_files.created_at IS '创建时间：文件上传时间';

-- 索引
CREATE INDEX idx_skill_files_skill_id ON aiops.skill_files(skill_id);

CREATE INDEX idx_skill_files_created_at ON aiops.skill_files(created_at);
