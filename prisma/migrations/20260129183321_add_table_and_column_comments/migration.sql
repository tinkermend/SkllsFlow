-- ============================================
-- 用户表注释
-- ============================================
COMMENT ON TABLE aiops.users IS '系统用户表，存储用户基本信息和认证数据';
COMMENT ON COLUMN aiops.users.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.users.user_uuid IS '业务 UUID，用于对外暴露的用户标识';
COMMENT ON COLUMN aiops.users.account_no IS '账号，用于登录，唯一';
COMMENT ON COLUMN aiops.users.email IS '邮箱地址，唯一';
COMMENT ON COLUMN aiops.users.password_hash IS '密码哈希值（bcrypt）';
COMMENT ON COLUMN aiops.users.username IS '用户昵称';
COMMENT ON COLUMN aiops.users.avatar IS '头像 URL 地址';
COMMENT ON COLUMN aiops.users.status IS '账户状态（active: 激活, disabled: 禁用）';
COMMENT ON COLUMN aiops.users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN aiops.users.login_failed_count IS '连续登录失败次数';
COMMENT ON COLUMN aiops.users.locked_until IS '账户锁定截止时间';
COMMENT ON COLUMN aiops.users.created_at IS '创建时间';
COMMENT ON COLUMN aiops.users.updated_at IS '更新时间';

-- ============================================
-- 角色表注释
-- ============================================
COMMENT ON TABLE aiops.roles IS '系统角色表，定义用户权限组';
COMMENT ON COLUMN aiops.roles.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.roles.name IS '角色名称（如：管理员、普通用户）';
COMMENT ON COLUMN aiops.roles.code IS '角色代码，唯一标识（如：admin、user）';
COMMENT ON COLUMN aiops.roles.description IS '角色描述说明';
COMMENT ON COLUMN aiops.roles.is_system IS '是否为系统内置角色（内置角色不可删除）';
COMMENT ON COLUMN aiops.roles.sort IS '排序权重，数值越小越靠前';
COMMENT ON COLUMN aiops.roles.status IS '角色状态（active: 激活, disabled: 禁用）';
COMMENT ON COLUMN aiops.roles.created_at IS '创建时间';
COMMENT ON COLUMN aiops.roles.updated_at IS '更新时间';

-- ============================================
-- 权限表注释
-- ============================================
COMMENT ON TABLE aiops.permissions IS '系统权限表，定义细粒度的操作权限';
COMMENT ON COLUMN aiops.permissions.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.permissions.name IS '权限名称（如：创建用户）';
COMMENT ON COLUMN aiops.permissions.code IS '权限代码，唯一标识（格式：resource:action，如：user:create）';
COMMENT ON COLUMN aiops.permissions.resource IS '资源类型（如：user、session、skill）';
COMMENT ON COLUMN aiops.permissions.action IS '操作类型（如：create、read、update、delete）';
COMMENT ON COLUMN aiops.permissions.description IS '权限描述说明';
COMMENT ON COLUMN aiops.permissions.module IS '所属功能模块（如：users、sessions、skills）';
COMMENT ON COLUMN aiops.permissions.created_at IS '创建时间';
COMMENT ON COLUMN aiops.permissions.updated_at IS '更新时间';

-- ============================================
-- 用户-角色关联表注释
-- ============================================
COMMENT ON TABLE aiops.user_roles IS '用户与角色的多对多关联表';
COMMENT ON COLUMN aiops.user_roles.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.user_roles.user_id IS '用户 ID，外键关联 users 表';
COMMENT ON COLUMN aiops.user_roles.role_id IS '角色 ID，外键关联 roles 表';
COMMENT ON COLUMN aiops.user_roles.created_at IS '创建时间';

-- ============================================
-- 角色-权限关联表注释
-- ============================================
COMMENT ON TABLE aiops.role_permissions IS '角色与权限的多对多关联表';
COMMENT ON COLUMN aiops.role_permissions.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.role_permissions.role_id IS '角色 ID，外键关联 roles 表';
COMMENT ON COLUMN aiops.role_permissions.permission_id IS '权限 ID，外键关联 permissions 表';
COMMENT ON COLUMN aiops.role_permissions.created_at IS '创建时间';

-- ============================================
-- 刷新令牌表注释
-- ============================================
COMMENT ON TABLE aiops.refresh_tokens IS 'JWT 刷新令牌表，用于令牌轮换和会话管理';
COMMENT ON COLUMN aiops.refresh_tokens.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.refresh_tokens.token_hash IS '刷新令牌的哈希值，唯一';
COMMENT ON COLUMN aiops.refresh_tokens.device_id IS '设备指纹标识';
COMMENT ON COLUMN aiops.refresh_tokens.ip_address IS '登录 IP 地址';
COMMENT ON COLUMN aiops.refresh_tokens.user_agent IS '用户代理字符串（浏览器信息）';
COMMENT ON COLUMN aiops.refresh_tokens.user_id IS '用户 ID，外键关联 users 表';
COMMENT ON COLUMN aiops.refresh_tokens.expires_at IS '令牌过期时间';
COMMENT ON COLUMN aiops.refresh_tokens.created_at IS '创建时间';
COMMENT ON COLUMN aiops.refresh_tokens.rotated_at IS '令牌轮换时间';
COMMENT ON COLUMN aiops.refresh_tokens.revoked_at IS '令牌撤销时间';

-- ============================================
-- 审计日志表注释
-- ============================================
COMMENT ON TABLE aiops.audit_logs IS '系统审计日志表，记录所有重要操作';
COMMENT ON COLUMN aiops.audit_logs.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.audit_logs.user_id IS '操作用户 ID（可为空，如匿名操作）';
COMMENT ON COLUMN aiops.audit_logs.action IS '操作类型（如：login、create_user、delete_session）';
COMMENT ON COLUMN aiops.audit_logs.resource IS '资源类型（如：user、session、role）';
COMMENT ON COLUMN aiops.audit_logs.resource_id IS '资源 ID（被操作的资源标识）';
COMMENT ON COLUMN aiops.audit_logs.details IS '操作详情，JSON 格式存储';
COMMENT ON COLUMN aiops.audit_logs.ip_address IS '操作来源 IP 地址';
COMMENT ON COLUMN aiops.audit_logs.user_agent IS '用户代理字符串（浏览器信息）';
COMMENT ON COLUMN aiops.audit_logs.created_at IS '创建时间';

-- ============================================
-- 会话表注释
-- ============================================
COMMENT ON TABLE aiops.sessions IS 'OpenCode 会话表，存储 AI 对话会话信息';
COMMENT ON COLUMN aiops.sessions.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.sessions.session_id IS '会话唯一标识符，对应 OpenCode session ID';
COMMENT ON COLUMN aiops.sessions.title IS '会话标题';
COMMENT ON COLUMN aiops.sessions.user_id IS '用户 ID，外键关联 users 表';
COMMENT ON COLUMN aiops.sessions.project_id IS '项目 ID，默认为 global';
COMMENT ON COLUMN aiops.sessions.status IS '会话状态（active: 活跃, delete: 已删除）';
COMMENT ON COLUMN aiops.sessions.opencode_server IS 'OpenCode 服务器地址';
COMMENT ON COLUMN aiops.sessions.directory IS '工作目录路径';
COMMENT ON COLUMN aiops.sessions.created_at IS '创建时间';
COMMENT ON COLUMN aiops.sessions.updated_at IS '更新时间';

-- ============================================
-- 菜单表注释
-- ============================================
COMMENT ON TABLE aiops.menus IS '系统菜单表，用于动态菜单和权限控制';
COMMENT ON COLUMN aiops.menus.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.menus.name IS '菜单名称';
COMMENT ON COLUMN aiops.menus.path IS '路由路径（如：/users、/settings）';
COMMENT ON COLUMN aiops.menus.icon IS '图标名称（对应图标库中的图标）';
COMMENT ON COLUMN aiops.menus.parent_id IS '父菜单 ID，用于构建树形结构';
COMMENT ON COLUMN aiops.menus.sort IS '排序权重，数值越小越靠前';
COMMENT ON COLUMN aiops.menus.type IS '菜单类型（menu: 菜单, button: 按钮）';
COMMENT ON COLUMN aiops.menus.permission IS '权限标识，用于权限校验';
COMMENT ON COLUMN aiops.menus.is_visible IS '是否在菜单中显示';
COMMENT ON COLUMN aiops.menus.is_external IS '是否为外部链接';
COMMENT ON COLUMN aiops.menus.status IS '菜单状态（active: 激活, disabled: 禁用）';
COMMENT ON COLUMN aiops.menus.created_at IS '创建时间';
COMMENT ON COLUMN aiops.menus.updated_at IS '更新时间';

-- ============================================
-- 角色-菜单关联表注释
-- ============================================
COMMENT ON TABLE aiops.role_menus IS '角色与菜单的多对多关联表';
COMMENT ON COLUMN aiops.role_menus.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.role_menus.role_id IS '角色 ID，外键关联 roles 表';
COMMENT ON COLUMN aiops.role_menus.menu_id IS '菜单 ID，外键关联 menus 表';
COMMENT ON COLUMN aiops.role_menus.created_at IS '创建时间';

-- ============================================
-- Agent 表注释
-- ============================================
COMMENT ON TABLE aiops.agents IS 'OpenCode Agent 配置表，存储 Agent 的配置信息';
COMMENT ON COLUMN aiops.agents.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.agents.agent_id IS 'Agent 唯一标识符';
COMMENT ON COLUMN aiops.agents.name IS 'Agent 名称，唯一';
COMMENT ON COLUMN aiops.agents.description IS 'Agent 描述说明';
COMMENT ON COLUMN aiops.agents.temperature IS '温度参数（0.0-1.0），控制 LLM 响应的随机性';
COMMENT ON COLUMN aiops.agents.max_steps IS '最大步数限制，控制 Agent 迭代次数';
COMMENT ON COLUMN aiops.agents.system_prompt IS '系统提示词，自定义系统提示词内容';
COMMENT ON COLUMN aiops.agents.tools_permissions IS '工具权限配置，JSONB 格式';
COMMENT ON COLUMN aiops.agents.action_permissions IS '操作权限配置，JSONB 格式';
COMMENT ON COLUMN aiops.agents.mode IS '模式：primary（主代理）、subagent（子代理）、all（全局可用）';
COMMENT ON COLUMN aiops.agents.model IS '覆盖的模型（如：anthropic/claude-haiku-4-20250514）';
COMMENT ON COLUMN aiops.agents.additional_params IS '服务商特定参数，JSONB 格式';
COMMENT ON COLUMN aiops.agents.config_content IS '配置文件内容，Markdown 格式';
COMMENT ON COLUMN aiops.agents.disabled IS '是否禁用，true 表示 Agent 不可用';
COMMENT ON COLUMN aiops.agents.hidden IS '是否隐藏，是否在菜单中隐藏（仅子代理）';
COMMENT ON COLUMN aiops.agents.created_by IS '创建人 ID';
COMMENT ON COLUMN aiops.agents.created_at IS '创建时间';
COMMENT ON COLUMN aiops.agents.updated_by IS '更新人 ID';
COMMENT ON COLUMN aiops.agents.updated_at IS '更新时间';
COMMENT ON COLUMN aiops.agents.deleted_by IS '删除人 ID';
COMMENT ON COLUMN aiops.agents.deleted_at IS '删除时间（软删除）';

-- ============================================
-- 技能表注释
-- ============================================
COMMENT ON TABLE aiops.skills IS '技能表，存储平台可用的 AI 技能信息';
COMMENT ON COLUMN aiops.skills.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.skills.skill_id IS '技能唯一标识符';
COMMENT ON COLUMN aiops.skills.name IS '技能名称';
COMMENT ON COLUMN aiops.skills.description IS '技能描述说明';
COMMENT ON COLUMN aiops.skills.icon IS '图标样式';
COMMENT ON COLUMN aiops.skills.category IS '技能分类（如：code-analysis、data-processing）';
COMMENT ON COLUMN aiops.skills.tags IS '技能标签数组';
COMMENT ON COLUMN aiops.skills.status IS '状态（active: 启用, disabled: 禁用）';
COMMENT ON COLUMN aiops.skills.sort_order IS '排序值，数字越小越靠前';
COMMENT ON COLUMN aiops.skills.file_path IS '技能压缩包文件路径';
COMMENT ON COLUMN aiops.skills.created_by IS '创建人 ID';
COMMENT ON COLUMN aiops.skills.created_at IS '创建时间';
COMMENT ON COLUMN aiops.skills.updated_by IS '更新人 ID';
COMMENT ON COLUMN aiops.skills.updated_at IS '更新时间';

-- ============================================
-- MCP 服务表注释
-- ============================================
COMMENT ON TABLE aiops.mcp_services IS 'MCP 服务表，存储 Model Context Protocol 服务的连接与能力元数据';
COMMENT ON COLUMN aiops.mcp_services.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.mcp_services.mcp_id IS 'MCP 服务唯一标识符';
COMMENT ON COLUMN aiops.mcp_services.name IS 'MCP 服务名称，唯一';
COMMENT ON COLUMN aiops.mcp_services.description IS 'MCP 服务描述说明';
COMMENT ON COLUMN aiops.mcp_services.version IS '服务版本号或协议版本';
COMMENT ON COLUMN aiops.mcp_services.transport_type IS '传输类型：stdio（本地进程）、sse（服务器发送事件）、websocket';
COMMENT ON COLUMN aiops.mcp_services.connection_config IS '连接细节，JSONB 格式';
COMMENT ON COLUMN aiops.mcp_services.env_vars IS '环境变量，仅用于 stdio 模式';
COMMENT ON COLUMN aiops.mcp_services.encrypted_auth_info IS '认证凭证，应用层加密后的字符串';
COMMENT ON COLUMN aiops.mcp_services.cached_capabilities IS '能力快照，缓存 Tools/Resources 列表';
COMMENT ON COLUMN aiops.mcp_services.status IS '服务状态：active、inactive、error、maintenance';
COMMENT ON COLUMN aiops.mcp_services.last_health_check_at IS '最后健康检查时间';
COMMENT ON COLUMN aiops.mcp_services.health_check_result IS '健康检查结果，JSONB 格式';
COMMENT ON COLUMN aiops.mcp_services.error_message IS '错误信息，简短的错误描述';
COMMENT ON COLUMN aiops.mcp_services.created_at IS '创建时间';
COMMENT ON COLUMN aiops.mcp_services.updated_at IS '更新时间';

-- ============================================
-- 消息表注释
-- ============================================
COMMENT ON TABLE aiops.messages IS '消息表，存储会话中的所有消息';
COMMENT ON COLUMN aiops.messages.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.messages.message_id IS '消息唯一标识符';
COMMENT ON COLUMN aiops.messages.session_id IS '会话 ID，关联 sessions 表';
COMMENT ON COLUMN aiops.messages.content IS '消息内容';
COMMENT ON COLUMN aiops.messages.role IS '消息角色：user（用户）、assistant（AI助手）、system（系统）';
COMMENT ON COLUMN aiops.messages.created_by IS '创建人 ID（user 角色时为用户 ID）';
COMMENT ON COLUMN aiops.messages.created_at IS '创建时间';

-- ============================================
-- 会话-Agent 关联表注释
-- ============================================
COMMENT ON TABLE aiops.session_agents IS '会话与 Agent 的关联表，记录会话中使用的 Agent';
COMMENT ON COLUMN aiops.session_agents.session_id IS '会话 ID，关联 sessions 表';
COMMENT ON COLUMN aiops.session_agents.agent_id IS 'Agent ID，关联 agents 表';
COMMENT ON COLUMN aiops.session_agents.created_at IS '关联创建时间';

-- ============================================
-- 会话-MCP 服务关联表注释
-- ============================================
COMMENT ON TABLE aiops.session_mcps IS '会话与 MCP 服务的关联表，记录会话中使用的 MCP 服务';
COMMENT ON COLUMN aiops.session_mcps.session_id IS '会话 ID，关联 sessions 表';
COMMENT ON COLUMN aiops.session_mcps.mcp_id IS 'MCP 服务 ID，关联 mcp_services 表';
COMMENT ON COLUMN aiops.session_mcps.created_at IS '关联创建时间';

-- ============================================
-- 会话-技能关联表注释
-- ============================================
COMMENT ON TABLE aiops.session_skills IS '会话与技能的关联表，记录会话中使用的技能';
COMMENT ON COLUMN aiops.session_skills.session_id IS '会话 ID，关联 sessions 表';
COMMENT ON COLUMN aiops.session_skills.skill_id IS '技能 ID，关联 skills 表';
COMMENT ON COLUMN aiops.session_skills.created_at IS '关联创建时间';

-- ============================================
-- 用户-技能关联表注释
-- ============================================
COMMENT ON TABLE aiops.user_skill IS '用户技能关联表，记录用户在特定会话中使用的技能';
COMMENT ON COLUMN aiops.user_skill.id IS '主键 ID，自增';
COMMENT ON COLUMN aiops.user_skill.user_id IS '用户 ID，关联 users 表';
COMMENT ON COLUMN aiops.user_skill.skill_id IS '技能 ID，关联 skills 表';
COMMENT ON COLUMN aiops.user_skill.session_id IS '会话 ID，关联 sessions 表';
COMMENT ON COLUMN aiops.user_skill.sort_order IS '排序值，用于页面显示卡片排序，数字越小越靠前';
COMMENT ON COLUMN aiops.user_skill.created_at IS '创建时间';
