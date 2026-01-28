-- ============================================
-- 权限表 (permissions)
-- ============================================
-- 说明：定义系统权限，每个权限代表一个可执行的操作
-- Schema: aiops
-- ============================================

-- 删除已存在的表
DROP TABLE IF EXISTS aiops.permissions CASCADE;

-- 创建权限表
CREATE TABLE aiops.permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    module VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表注释
COMMENT ON TABLE aiops.permissions IS '权限表：定义系统权限，每个权限代表一个可执行的操作';

-- 字段注释
COMMENT ON COLUMN aiops.permissions.id IS '主键：数据库内部使用的自增ID';
COMMENT ON COLUMN aiops.permissions.name IS '权限名称：如创建用户、删除会话';
COMMENT ON COLUMN aiops.permissions.code IS '权限代码：唯一标识符，格式为 resource:action，如 user:create';
COMMENT ON COLUMN aiops.permissions.resource IS '资源类型：如 user、session、skill';
COMMENT ON COLUMN aiops.permissions.action IS '操作类型：如 create、read、update、delete';
COMMENT ON COLUMN aiops.permissions.description IS '权限描述：权限的详细说明';
COMMENT ON COLUMN aiops.permissions.module IS '所属模块：如 users、sessions、skills';
COMMENT ON COLUMN aiops.permissions.created_at IS '创建时间：记录创建时间';
COMMENT ON COLUMN aiops.permissions.updated_at IS '更新时间：记录最后更新时间';

-- 创建索引
CREATE INDEX idx_permissions_module ON aiops.permissions (module);
CREATE INDEX idx_permissions_code ON aiops.permissions (code);

-- 创建更新时间触发器
CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON aiops.permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
