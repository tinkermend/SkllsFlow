-- AddForeignKey
ALTER TABLE "user_skill" ADD CONSTRAINT "user_skill_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 更新 permissions 表的 module 字段为中文
-- ============================================

-- 用户管理模块
UPDATE aiops.permissions SET module = '用户管理' WHERE module = 'users';

-- 角色管理模块
UPDATE aiops.permissions SET module = '角色管理' WHERE module = 'roles';

-- 权限管理模块
UPDATE aiops.permissions SET module = '权限管理' WHERE module = 'permissions';

-- 会话管理模块
UPDATE aiops.permissions SET module = '会话管理' WHERE module = 'sessions';

-- 技能管理模块
UPDATE aiops.permissions SET module = '技能管理' WHERE module = 'skills';

-- MCP管理模块
UPDATE aiops.permissions SET module = 'MCP管理' WHERE module = 'mcps';

-- Agent管理模块
UPDATE aiops.permissions SET module = 'Agent管理' WHERE module = 'agents';

-- 菜单管理模块
UPDATE aiops.permissions SET module = '菜单管理' WHERE module = 'menus';
