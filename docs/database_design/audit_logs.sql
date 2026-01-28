-- ============================================
-- 审计日志表 (audit_logs)
-- ============================================
-- 说明：记录系统操作日志，用于审计和追踪
-- Schema: aiops
-- ============================================

-- 删除已存在的表
DROP TABLE IF EXISTS aiops.audit_logs CASCADE;

-- 创建审计日志表
CREATE TABLE aiops.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表注释
COMMENT ON TABLE aiops.audit_logs IS '审计日志表：记录系统操作日志，用于审计和追踪';

-- 字段注释
COMMENT ON COLUMN aiops.audit_logs.id IS '主键：数据库内部使用的自增ID';
COMMENT ON COLUMN aiops.audit_logs.user_id IS '用户ID：操作用户的ID，可为空（系统操作）';
COMMENT ON COLUMN aiops.audit_logs.action IS '操作类型：如 login、create_user、delete_session';
COMMENT ON COLUMN aiops.audit_logs.resource IS '资源类型：如 user、session、skill';
COMMENT ON COLUMN aiops.audit_logs.resource_id IS '资源ID：被操作资源的ID';
COMMENT ON COLUMN aiops.audit_logs.details IS '操作详情：JSON 格式的详细信息';
COMMENT ON COLUMN aiops.audit_logs.ip_address IS 'IP 地址：操作来源的 IP 地址';
COMMENT ON COLUMN aiops.audit_logs.user_agent IS 'User Agent：用户浏览器信息';
COMMENT ON COLUMN aiops.audit_logs.created_at IS '创建时间：日志记录时间';

-- 创建索引
CREATE INDEX idx_audit_logs_user_id ON aiops.audit_logs (user_id);
CREATE INDEX idx_audit_logs_action ON aiops.audit_logs (action);
CREATE INDEX idx_audit_logs_resource ON aiops.audit_logs (resource);
CREATE INDEX idx_audit_logs_created_at ON aiops.audit_logs (created_at);
