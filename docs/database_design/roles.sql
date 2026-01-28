-- ============================================
-- 角色表 (roles)
-- ============================================
-- 说明：定义用户角色，每个角色包含一组权限
-- Schema: aiops
-- ============================================

-- 删除已存在的表
DROP TABLE IF EXISTS aiops.roles CASCADE;

-- 创建角色状态枚举类型
DO $$ BEGIN
    CREATE TYPE aiops.role_status AS ENUM ('active', 'disabled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建角色表
CREATE TABLE aiops.roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    sort INTEGER NOT NULL DEFAULT 0,
    status aiops.role_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表注释
COMMENT ON TABLE aiops.roles IS '角色表：定义用户角色，每个角色包含一组权限';

-- 字段注释
COMMENT ON COLUMN aiops.roles.id IS '主键：数据库内部使用的自增ID';
COMMENT ON COLUMN aiops.roles.name IS '角色名称：如管理员、普通用户';
COMMENT ON COLUMN aiops.roles.code IS '角色代码：唯一标识符，如 admin、user';
COMMENT ON COLUMN aiops.roles.description IS '角色描述：角色的详细说明';
COMMENT ON COLUMN aiops.roles.is_system IS '是否系统内置：系统内置角色不可删除';
COMMENT ON COLUMN aiops.roles.sort IS '排序：用于角色列表排序';
COMMENT ON COLUMN aiops.roles.status IS '状态：active（激活）、disabled（禁用）';
COMMENT ON COLUMN aiops.roles.created_at IS '创建时间：记录创建时间';
COMMENT ON COLUMN aiops.roles.updated_at IS '更新时间：记录最后更新时间';

-- 创建索引
CREATE INDEX idx_roles_code ON aiops.roles (code);
CREATE INDEX idx_roles_status ON aiops.roles (status);

-- 创建更新时间触发器
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON aiops.roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
