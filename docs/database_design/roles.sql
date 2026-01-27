-- ----------------------------------------------------------------------------
-- 1.2 roles - 角色表
-- ----------------------------------------------------------------------------

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    role_id VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE roles IS '角色表：定义用户角色，每个角色包含一组权限';

COMMENT ON COLUMN roles.role_id IS '角色ID：唯一标识符';

COMMENT ON COLUMN roles.name IS '角色名称：唯一，如admin, user, guest';

-- Trigger for updated_at
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
