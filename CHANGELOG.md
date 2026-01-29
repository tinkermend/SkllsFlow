# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2026-01-29

#### RBAC 权限管理系统 - 第七阶段：测试和文档

**文档创建**

1. **RBAC 实现文档** (`docs/rbac-implementation.md`)
   - 完整的系统概述和技术栈说明
   - 数据库 ER 图和核心表结构详解
   - 权限设计说明（21个权限，8个模块）
   - 认证流程图（登录、令牌刷新、登出）
   - 权限验证流程（前后端）
   - 完整的 API 接口文档
   - 前端集成指南（Zustand + CASL）
   - 常见问题和故障排查
   - 安全建议和最佳实践

2. **测试指南文档** (`docs/testing-guide.md`)
   - 测试环境准备和配置
   - 单元测试示例（密码服务、JWT 服务、权限中间件）
   - 集成测试示例（登录接口、令牌刷新）
   - 前端测试示例（PermissionGuard 组件）
   - E2E 测试示例（Playwright）
   - 测试覆盖率目标和最佳实践

**技术要点**
- 使用 Vitest 作为测试框架
- 使用 Supertest 进行 API 集成测试
- 使用 @testing-library/react 进行组件测试
- 使用 Playwright 进行端到端测试
- 文档包含完整的代码示例和配置说明

#### RBAC 权限管理系统 - 第二阶段完成

**目录结构创建**
- 创建 `server/services/auth/` 认证服务目录
- 创建 `server/repositories/` 数据仓储目录
- 创建 `server/controllers/` 控制器目录
- 创建 `server/middleware/` 中间件目录
- 创建 `server/routes/` 路由目录

**核心服务层实现**

1. **密码加密服务** (`server/services/auth/password.service.ts`)
   - 实现 bcrypt 密码哈希功能
   - 实现密码验证功能
   - 实现密码强度验证（最少8位，包含大小写字母和数字）

2. **JWT 令牌服务** (`server/services/auth/jwt.service.ts`)
   - 实现访问令牌生成（默认15分钟过期）
   - 实现刷新令牌生成（默认7天过期）
   - 实现令牌验证和解码功能
   - 支持 BigInt 类型的 userId 处理

3. **用户仓储** (`server/repositories/users.repository.ts`)
   - 继承 BaseRepository 实现通用 CRUD
   - 实现通过账号查找用户
   - 实现通过邮箱查找用户
   - 实现更新最后登录时间
   - 实现查询用户及其角色关联

4. **刷新令牌仓储** (`server/repositories/refresh-tokens.repository.ts`)
   - 实现刷新令牌创建（支持设备指纹、IP、UA）
   - 实现通过哈希查找令牌
   - 实现令牌轮换（Refresh Token Rotation）
   - 实现令牌撤销
   - 实现过期令牌清理

5. **认证服务** (`server/services/auth/auth.service.ts`)
   - 实现用户登录（密码验证、状态检查、令牌生成）
   - 实现用户注册（密码强度验证、自动分配默认角色）
   - 实现令牌刷新（Refresh Token Rotation 机制）
   - 实现用户登出（令牌撤销）
   - 实现获取当前用户信息（包含权限和角色）
   - 使用 SHA256 哈希存储刷新令牌

6. **RBAC 权限服务** (`server/services/auth/rbac.service.ts`)
   - 实现获取用户所有权限代码
   - 实现检查用户是否拥有指定权限
   - 实现检查用户是否拥有任一权限（OR 逻辑）
   - 实现检查用户是否拥有所有权限（AND 逻辑）
   - 实现检查用户是否拥有指定角色
   - 实现检查用户是否拥有任一角色

7. **审计日志服务** (`server/services/audit-log.service.ts`)
   - 实现审计日志记录功能
   - 支持记录用户操作（登录、登出、刷新、用户管理、角色分配等）
   - 支持记录 IP 地址和 User Agent
   - 支持 JSON 格式的详细信息存储

**中间件层实现**

1. **JWT 认证中间件** (`server/middleware/jwt-auth.middleware.ts`)
   - 实现 JWT 令牌验证中间件
   - 从 Authorization Header 提取和验证 Bearer Token
   - 验证令牌类型（仅接受 access token）
   - 将用户信息注入到 Express Request 对象
   - 实现可选认证中间件（optionalJwtAuthMiddleware）
   - 扩展 Express Request 类型定义（支持 user 属性）

2. **RBAC 权限中间件** (`server/middleware/rbac.middleware.ts`)
   - 实现 `requirePermissions` 中间件（要求所有指定权限，AND 逻辑）
   - 实现 `requireAnyPermission` 中间件（要求任一权限，OR 逻辑）
   - 实现 `requireRoles` 中间件（要求所有指定角色）
   - 实现 `requireAnyRole` 中间件（要求任一角色）
   - 统一的错误响应格式（401 未登录，403 权限不足，500 服务器错误）
   - 支持中间件链式调用

**控制器层实现**

1. **认证控制器** (`server/controllers/auth.controller.ts`)
   - 实现用户注册接口（register）
   - 实现用户登录接口（login）
   - 实现用户登出接口（logout）
   - 实现令牌刷新接口（refresh）
   - 实现获取当前用户信息接口（me）
   - 使用 HttpOnly Cookie 存储 Refresh Token
   - Cookie 配置：7天过期、Strict SameSite、生产环境启用 Secure

2. **用户管理控制器** (`server/controllers/users.controller.ts`)
   - 实现用户列表查询（getUsers）- 支持分页和搜索
   - 实现用户详情查询（getUserById）- 包含角色和权限信息
   - 实现用户信息更新（updateUser）
   - 实现用户删除（deleteUser）
   - 实现用户角色分配（assignRoles）

3. **角色管理控制器** (`server/controllers/roles.controller.ts`)
   - 实现角色列表查询（listRoles）- 包含权限关联
   - 实现角色创建（createRole）- 支持同时分配权限
   - 实现角色更新（updateRole）- 使用事务确保数据一致性

4. **权限管理控制器** (`server/controllers/permissions.controller.ts`)
   - 实现权限列表查询（listPermissions）- 支持按模块筛选
   - 实现权限同步（syncPermissions）- 支持批量 upsert 操作

**路由层实现**

1. **认证路由** (`server/routes/auth.routes.ts`)
   - POST /api/auth/register - 用户注册（公开）
   - POST /api/auth/login - 用户登录（公开）
   - POST /api/auth/logout - 用户登出（公开）
   - POST /api/auth/refresh - 刷新令牌（公开）
   - GET /api/auth/me - 获取当前用户信息（需要认证）

2. **用户管理路由** (`server/routes/users.routes.ts`)
   - GET /api/users - 获取用户列表（需要 user:view 权限）
   - GET /api/users/:id - 获取用户详情（需要 user:view 权限）
   - PUT /api/users/:id - 更新用户信息（需要 user:update 权限）
   - DELETE /api/users/:id - 删除用户（需要 user:delete 权限）
   - PUT /api/users/:id/roles - 分配角色（需要 user:assign-roles 权限）
   - 所有路由使用 jwtAuthMiddleware 进行认证

3. **角色管理路由** (`server/routes/roles.routes.ts`)
   - GET /api/roles - 获取角色列表（需要 role:view 权限）
   - POST /api/roles - 创建角色（需要 role:create 权限）
   - PUT /api/roles/:id - 更新角色（需要 role:update 权限）
   - 所有路由使用 jwtAuthMiddleware 进行认证

4. **权限管理路由** (`server/routes/permissions.routes.ts`)
   - GET /api/permissions - 获取权限列表（需要 permission:view 权限）
   - POST /api/permissions/sync - 同步权限（需要 permission:sync 权限）
   - 所有路由使用 jwtAuthMiddleware 进行认证

**服务器集成** (`server/index.ts`)
   - 添加 cookie-parser 中间件（支持 HttpOnly Cookie）
   - 集成认证路由（/api/auth）
   - 集成用户管理路由（/api/users）
   - 集成角色管理路由（/api/roles）
   - 集成权限管理路由（/api/permissions）
   - 保持现有的 OpenCode、Skills、Sessions 路由

#### RBAC 权限管理系统 - 第五阶段完成（现有功能集成）

**AI 对话功能权限集成**

1. **会话侧边栏** (`src/features/ai-chat/components/session-sidebar.tsx`)
   - 为顶部创建会话按钮添加 `session:create` 权限控制
   - 为空状态下的创建按钮添加 `session:create` 权限控制
   - 为底部新建对话按钮添加 `session:create` 权限控制
   - 无权限用户将无法看到任何创建会话的入口

2. **会话项组件** (`src/features/ai-chat/components/session-item.tsx`)
   - 为重命名操作添加 `Session:update` 权限检查
   - 为删除会话操作添加 `Session:delete` 权限检查
   - 使用 `usePermission` Hook 进行细粒度权限控制
   - 无权限的菜单项将不会显示

**技能管理功能权限集成**

1. **技能主页面** (`src/features/skills/index.tsx`)
   - 为顶部创建技能按钮添加 `skill:create` 权限控制
   - 为空状态下的创建按钮添加 `skill:create` 权限控制
   - 使用 `PermissionGuard` 组件包裹创建入口
   - 无权限用户将无法看到创建技能的按钮

2. **技能卡片组件** (`src/features/skills/components/skill-card.tsx`)
   - 为卸载技能操作添加 `Skill:uninstall` 权限检查（我的技能模式）
   - 为启用/禁用操作添加 `Skill:update` 权限检查（平台技能模式）
   - 为删除技能操作添加 `Skill:delete` 权限检查（平台技能模式）
   - 为装载技能操作添加 `Skill:install` 权限检查（平台技能模式）
   - 使用 `usePermission` Hook 进行细粒度权限控制
   - 无权限的操作菜单项将不会显示

**权限点定义**

本阶段集成的权限点包括：

1. **会话管理权限**
   - `session:create` - 创建新会话
   - `Session:update` - 更新会话（重命名）
   - `Session:delete` - 删除会话

2. **技能管理权限**
   - `skill:create` - 创建技能
   - `Skill:update` - 更新技能状态（启用/禁用）
   - `Skill:delete` - 删除技能
   - `Skill:install` - 装载技能到会话
   - `Skill:uninstall` - 从会话卸载技能

**实现特点**
- 使用 `PermissionGuard` 组件进行声明式权限控制
- 使用 `usePermission` Hook 进行命令式权限检查
- 权限控制粒度细化到按钮和菜单项级别
- 无权限的 UI 元素完全不显示，提升用户体验
- 前端权限控制与后端 API 权限验证保持一致

#### RBAC 权限管理系统 - 第六阶段完成（安全增强）

**密码策略增强** (`server/services/auth/password.service.ts`)
- 添加特殊字符要求（!@#$%^&*等）
- 密码必须包含：大写字母、小写字母、数字、特殊字符
- 最小长度要求：8 个字符
- 提供详细的密码强度验证错误提示

**账户锁定机制**

1. **数据库层** (`prisma/schema.prisma`)
   - User 表新增 `loginFailedCount` 字段 - 记录登录失败次数
   - User 表新增 `lockedUntil` 字段 - 记录账户锁定截止时间
   - 支持自动解锁机制

2. **认证服务** (`server/services/auth/auth.service.ts`)
   - 实现登录失败计数逻辑
   - 达到 5 次失败后自动锁定账户 30 分钟
   - 登录成功后自动重置失败计数和锁定状态
   - 锁定期间显示剩余解锁时间
   - 添加 `handleLoginFailure` 私有方法处理登录失败
   - 添加 `resetLoginFailures` 私有方法重置失败计数

**设备管理功能**

1. **刷新令牌仓储** (`server/repositories/refresh-tokens.repository.ts`)
   - 添加 `findActiveTokensByUserId` 方法 - 查询用户所有活跃设备
   - 添加 `revokeToken` 方法 - 通过 ID 撤销令牌
   - 支持按创建时间倒序排列设备列表

2. **设备管理控制器** (`server/controllers/devices.controller.ts`)
   - 实现 `getDevices` 接口 - 获取当前用户的所有活跃设备
   - 实现 `revokeDevice` 接口 - 踢出指定设备
   - 返回设备信息：设备 ID、IP 地址、User Agent、最后活跃时间
   - 验证设备所有权，防止越权操作

3. **设备管理路由** (`server/routes/devices.routes.ts`)
   - GET /api/devices - 获取设备列表（需要认证）
   - DELETE /api/devices/:tokenId - 踢出设备（需要认证）

4. **服务器集成** (`server/index.ts`)
   - 集成设备管理路由（/api/devices）

**安全特性总结**

- 密码强度验证：8位+大小写字母+数字+特殊字符
- 账户锁定：5次失败锁定30分钟，自动解锁
- 设备管理：查看活跃设备、远程踢出设备
- 令牌安全：SHA256哈希存储、支持轮换和撤销
- 设备追踪：记录设备指纹、IP地址、User Agent
- 防暴力破解：登录失败计数、自动锁定机制

**技术特性**
- 遵循 Repository 模式，不直接使用 Prisma Client
- 使用 DatabaseService 单例管理数据库连接
- 支持 TypeScript 严格类型检查
- 使用 ES Module 导入导出（.js 扩展名）
- 实现 Refresh Token Rotation 安全机制
- 使用 SHA256 哈希存储刷新令牌

**安全增强**
- 密码使用 bcrypt 加密（10 轮 salt）
- 刷新令牌使用 SHA256 哈希存储
- 支持令牌轮换防止重放攻击
- 支持设备指纹追踪
- 支持审计日志记录所有敏感操作

#### RBAC 权限管理系统 - 第三阶段：前端集成（3.1 & 3.2）

**依赖安装**
- 安装 `@casl/ability@6.8.0` - 用于细粒度权限控制

**核心配置文件**

1. **API 客户端配置** (`src/lib/api-client.ts`)
   - 创建 Axios 客户端实例（baseURL: /api, timeout: 10s）
   - 请求拦截器：自动添加 JWT Authorization Header
   - 响应拦截器：处理 401 错误和自动刷新 Token
   - 支持 httpOnly Cookie 携带 Refresh Token
   - Token 刷新失败自动跳转登录页

2. **CASL Ability 定义** (`src/lib/ability.ts`)
   - 定义 Actions 类型：create, read, update, delete, install, uninstall, assign-roles, assign-permissions
   - 定义 Subjects 类型：User, Role, Session, Skill, Mcp, Agent, all
   - 实现 `defineAbilityFor()` 函数：根据权限代码列表创建 Ability 实例
   - 实现 `parsePermission()` 函数：解析权限代码（格式：resource:action）
   - 权限代码映射到 CASL action（如 view → read）

3. **Ability Context** (`src/context/ability-context.tsx`)
   - 创建 AbilityContext 用于全局共享权限能力
   - 实现 `useAbility()` Hook：获取当前用户的权限能力
   - 提供类型安全的 Context 访问

4. **Ability Provider 组件** (`src/components/auth/ability-provider.tsx`)
   - 从 auth-store 读取用户权限列表
   - 调用 `defineAbilityFor()` 创建 Ability 实例
   - 通过 AbilityContext.Provider 向下传递权限能力
   - 支持权限动态更新

**状态管理更新**

1. **Auth Store 更新** (`src/stores/auth-store.ts`)
   - 更新 `AuthUser` 接口，新增字段：
     - `id: bigint` - 用户 ID
     - `username: string` - 用户名
     - `roles: string[]` - 角色列表
     - `permissions: string[]` - 权限代码列表
   - 保留原有字段：accountNo, email, exp
   - 支持权限和角色的动态管理

**技术特性**
- 使用 CASL 实现细粒度权限控制
- Context + Provider 模式全局共享权限能力
- Axios 拦截器自动处理 Token 刷新
- 支持 httpOnly Cookie 存储 Refresh Token
- 完整的 TypeScript 类型定义
- 权限代码格式：`resource:action`（如 `user:view`, `role:create`）

#### RBAC 权限管理系统 - 第三阶段：前端集成（3.3 & 3.4）

**权限控制组件**

1. **Can 组件** (`src/components/auth/can.tsx`)
   - 基于权限的条件渲染组件
   - 支持 `action` 和 `subject` 参数
   - 支持 `fallback` 属性显示无权限时的内容
   - 使用 `useAbility()` Hook 检查权限
   - 示例：`<Can action="create" subject="User">创建按钮</Can>`

2. **RoleGuard 组件** (`src/components/auth/role-guard.tsx`)
   - 基于角色的访问控制组件
   - 支持 `allowedRoles` 数组参数
   - 支持 `fallback` 属性显示无权限时的内容
   - 从 auth-store 读取用户角色列表
   - 示例：`<RoleGuard allowedRoles={['admin', 'manager']}>管理面板</RoleGuard>`

3. **ProtectedRoute 组件** (`src/components/auth/protected-route.tsx`)
   - 路由级权限保护组件
   - 支持 `requiredRoles` 参数（角色检查）
   - 支持 `requiredPermission` 参数（权限检查）
   - 支持 `redirectTo` 参数（自定义重定向路径）
   - 未登录自动跳转到 `/sign-in`
   - 无权限跳转到指定页面（默认 `/unauthorized`）
   - 示例：`<ProtectedRoute requiredPermission={{ action: 'delete', subject: 'User' }}>用户管理</ProtectedRoute>`

**自定义 Hooks**

1. **usePermission Hook** (`src/hooks/use-permission.ts`)
   - 权限检查 Hook
   - 提供 `can(action, subject)` 方法：检查是否有权限
   - 提供 `cannot(action, subject)` 方法：检查是否无权限
   - 返回布尔值，便于条件判断
   - 示例：`const { can } = usePermission(); if (can('create', 'User')) { ... }`

2. **useRole Hook** (`src/hooks/use-role.ts`)
   - 角色检查 Hook
   - 提供 `hasRole(role)` 方法：检查是否具有指定角色
   - 提供 `hasAnyRole(roles)` 方法：检查是否具有任意一个角色
   - 提供 `hasAllRoles(roles)` 方法：检查是否具有所有角色
   - 提供 `roles` 属性：当前用户的角色列表
   - 示例：`const { hasRole } = useRole(); if (hasRole('admin')) { ... }`

**技术特性**
- 组件级权限控制（Can, RoleGuard）
- 路由级权限保护（ProtectedRoute）
- 灵活的 Hooks API（usePermission, useRole）
- 支持 fallback 内容显示
- 完整的 TypeScript 类型定义
- 与 TanStack Router 无缝集成

**使用场景**
- UI 元素条件渲染（按钮、菜单项等）
- 页面级访问控制
- 功能模块权限保护
- 角色分级管理

**下一步计划**
- 实现前端用户管理页面
- 实现前端角色管理页面
- 实现前端权限管理页面

#### RBAC 权限管理系统 - 第三阶段：前端集成（3.5-3.7）

**Store 更新**

1. **Auth Store 增强** (`src/stores/auth-store.ts`)
   - 新增 `accessTokenExpiresAt: number` 字段：记录 Token 过期时间戳
   - 更新 `setAccessToken(token, expiresIn)` 方法：接收过期时间参数
   - 自动计算 Token 过期时间：`Date.now() + expiresIn * 1000`
   - 更新 `reset()` 方法：同时重置 `accessTokenExpiresAt` 为 0
   - 支持 Token 过期检查

**认证 Hook**

1. **useAuth Hook** (`src/hooks/use-auth.ts`)
   - 提供 `login(credentials)` 方法：用户登录功能
   - 提供 `logout()` 方法：用户登出功能
   - 提供 `isAuthenticated` 属性：检查是否已认证
   - 提供 `isTokenExpired()` 方法：检查 Token 是否过期
   - 提供 `user` 属性：当前用户信息
   - 登录成功后自动保存用户信息和 Token
   - 登录成功后自动跳转到首页或重定向页面
   - 登出后自动清理状态并跳转到登录页
   - 集成 Sonner Toast 提示

**登录页面更新**

1. **UserAuthForm 组件** (`src/features/auth/sign-in/components/user-auth-form.tsx`)
   - 更新表单字段：`email` → `accountNo`（账号）
   - 集成 `useAuth` Hook 实现真实登录逻辑
   - 移除 Mock 登录代码
   - 使用 `login()` 方法调用后端 API
   - 自动处理登录成功/失败状态
   - 保持 PasswordInput 组件（已存在）

**路由守卫**

1. **认证路由守卫** (`src/routes/_authenticated/route.tsx`)
   - 在 `beforeLoad` 钩子中实现路由守卫逻辑
   - 检查用户是否已登录（`accessToken` 是否存在）
   - 检查 Token 是否过期（`accessTokenExpiresAt < Date.now()`）
   - 未登录或 Token 过期自动重定向到 `/sign-in`
   - 重定向时携带 `redirect` 参数保存原始路径
   - 登录成功后自动跳转回原始路径

**技术特性**
- Token 过期时间自动管理
- 真实 API 集成（替代 Mock）
- 路由级认证保护
- 自动重定向机制
- 完整的用户体验流程

**安全增强**
- Token 过期自动检查
- 未授权访问自动拦截
- 登录状态持久化
- 安全的重定向机制

#### RBAC 权限管理系统 - 第四阶段：用户管理页面（4.1）

**权限守卫组件**

1. **PermissionGuard 组件** (`src/components/auth/permission-guard.tsx`)
   - 基于权限的条件渲染组件
   - 支持 `permission` 参数（权限代码字符串）
   - 支持 `fallback` 属性显示无权限时的内容
   - 从 auth-store 读取用户权限列表
   - 示例：`<PermissionGuard permission="user:create">创建按钮</PermissionGuard>`

**用户数据模型更新**

1. **用户 Schema** (`src/features/users/data/schema.ts`)
   - 更新用户数据结构以匹配后端 API
   - 新增字段：
     - `accountNo: string` - 账号
     - `avatar: string | null` - 头像 URL
     - `lastLoginAt: Date | null` - 最后登录时间
     - `userRoles: Array<{ role: { name, code } }>` - 用户角色关联
   - 移除字段：`firstName`, `lastName`, `phoneNumber`, `updatedAt`
   - 支持 BigInt ID 自动转换为字符串
   - 完整的 TypeScript 类型定义

**用户表格组件更新**

1. **用户表格列定义** (`src/features/users/components/users-columns.tsx`)
   - 更新列定义以匹配新的用户数据结构
   - 新增 `accountNo` 列：显示用户账号
   - 更新 `roles` 列：显示用户角色列表（Badge 样式）
   - 移除 `fullName` 列（firstName + lastName）
   - 移除 `phoneNumber` 列
   - 角色列表为空时显示"无角色"提示
   - 使用 Badge 组件美化角色显示

**权限控制集成**

1. **用户主按钮组件** (`src/features/users/components/users-primary-buttons.tsx`)
   - 为"邀请用户"按钮添加 `user:create` 权限守卫
   - 为"添加用户"按钮添加 `user:create` 权限守卫
   - 无权限时按钮自动隐藏

2. **表格操作按钮组件** (`src/features/users/components/data-table-row-actions.tsx`)
   - 为"编辑"操作添加 `user:update` 权限检查
   - 为"删除"操作添加 `user:delete` 权限检查
   - 无任何操作权限时整个操作按钮隐藏
   - 有部分权限时仅显示有权限的操作项
   - 动态显示/隐藏分隔线

**技术特性**
- 细粒度权限控制（按钮级、操作级）
- 权限守卫组件（PermissionGuard）
- 动态权限检查（基于 auth-store）
- 用户数据结构与后端 API 完全匹配
- 角色列表可视化展示（Badge 样式）
- 完整的 TypeScript 类型定义

**使用场景**
- 用户列表页面权限控制
- 创建/编辑/删除用户按钮权限保护
- 表格操作菜单动态显示
- 角色信息可视化展示

**下一步计划**
- 实现用户创建/编辑功能（对接后端 API）
- 实现角色管理页面
- 实现权限管理页面
- 实现用户角色分配功能

#### RBAC 权限管理系统 - 第四阶段：角色管理页面（4.2）

**角色数据模型**

1. **角色 Schema** (`src/features/roles/data/schema.ts`)
   - 创建角色数据结构以匹配后端 API
   - 角色字段：
     - `id: string` - 角色 ID（支持 BigInt 自动转换）
     - `name: string` - 角色名称
     - `code: string` - 角色代码
     - `description: string | null` - 角色描述
     - `isSystem: boolean` - 是否系统内置角色
     - `sort: number` - 排序
     - `status: 'active' | 'inactive'` - 状态
     - `rolePermissions: Array<{ permission }>` - 角色权限关联
   - 权限字段：`id`, `name`, `code`, `resource`, `action`
   - 完整的 TypeScript 类型定义

**路由配置**

1. **角色管理路由** (`src/routes/_authenticated/settings/roles/index.tsx`)
   - 创建角色管理页面路由：`/settings/roles`
   - 集成 RolesPage 组件
   - 使用 TanStack Router 文件系统路由

**核心组件实现**

1. **角色管理主页面** (`src/features/roles/index.tsx`)
   - 页面标题和描述
   - 集成 RolesProvider 状态管理
   - 集成 RolesPrimaryButtons 主操作按钮
   - 集成 RolesTable 角色列表表格
   - 集成 RoleFormDialog 创建/编辑对话框
   - 集成 RoleDeleteDialog 删除确认对话框

2. **角色状态管理** (`src/features/roles/components/roles-provider.tsx`)
   - 使用 Context + Provider 模式
   - 管理对话框状态：`open: 'add' | 'edit' | 'delete' | null`
   - 管理当前选中角色：`currentRole: Role | null`
   - 提供 `useRoles()` Hook 访问状态

3. **角色主按钮组件** (`src/features/roles/components/roles-primary-buttons.tsx`)
   - "创建角色"按钮
   - 使用 PermissionGuard 包裹（`role:create` 权限）
   - 点击打开创建对话框

4. **角色表格组件** (`src/features/roles/components/roles-table.tsx`)
   - 使用 TanStack Query 获取角色列表
   - 调用 `/api/roles` 接口
   - 使用 DataTable 组件展示数据
   - 支持搜索功能（按角色名称）
   - 集成 rolesColumns 列定义

5. **角色表格列定义** (`src/features/roles/components/roles-columns.tsx`)
   - 选择列：支持多选
   - 角色名称列：加粗显示
   - 角色代码列：使用 code 标签样式
   - 描述列：最大宽度 300px，超出截断
   - 状态列：Badge 显示（启用/禁用）
   - 权限数量列：Badge 显示权限数量
   - 操作列：集成 DataTableRowActions

6. **表格行操作组件** (`src/features/roles/components/data-table-row-actions.tsx`)
   - 编辑操作：需要 `role:update` 权限
   - 删除操作：需要 `role:delete` 权限
   - 系统内置角色不显示删除选项
   - 无任何操作权限时整个操作按钮隐藏
   - 动态显示/隐藏分隔线

**对话框组件实现**

1. **角色表单对话框** (`src/features/roles/components/role-form-dialog.tsx`)
   - 支持创建和编辑两种模式
   - 表单字段：
     - 角色名称（必填）
     - 角色代码（必填，正则验证：小写字母、数字、横线、下划线）
     - 描述（可选）
     - 状态（启用/禁用）
     - 权限配置（集成 PermissionPicker）
   - 系统内置角色的代码字段禁用编辑
   - 使用 react-hook-form + zod 表单验证
   - 使用 TanStack Query mutation 提交数据
   - 成功后自动刷新角色列表

2. **权限选择器组件** (`src/features/roles/components/permission-picker.tsx`)
   - 从 `/api/permissions` 接口获取权限列表
   - 按模块分组显示权限
   - 支持模块级全选/取消全选
   - 支持单个权限选择/取消
   - 显示已选择权限数量
   - 支持清空所有选择
   - 使用 ScrollArea 组件（高度 400px）
   - 权限项显示：名称、代码、描述
   - 选中状态使用 Checkbox 和 Check 图标

3. **角色删除对话框** (`src/features/roles/components/role-delete-dialog.tsx`)
   - 使用 AlertDialog 组件
   - 显示角色名称确认
   - 警告提示：删除角色将同时删除权限关联
   - 使用 TanStack Query mutation 提交删除请求
   - 成功后自动刷新角色列表
   - 删除按钮使用 destructive 样式

**技术特性**
- 细粒度权限控制（按钮级、操作级）
- 权限守卫组件（PermissionGuard）
- 动态权限检查（基于 auth-store）
- 角色数据结构与后端 API 完全匹配
- 按模块分组的权限选择器
- 系统内置角色保护（不可删除）
- 完整的 TypeScript 类型定义
- 使用 TanStack Query 管理数据状态
- 使用 react-hook-form + zod 表单验证

**使用场景**
- 角色列表页面权限控制
- 创建/编辑/删除角色按钮权限保护
- 表格操作菜单动态显示
- 角色权限配置管理
- 按模块分组的权限选择
- 系统内置角色保护

**下一步计划**
- 实现权限管理页面
- 实现用户角色分配功能
- 实现用户创建/编辑功能（对接后端 API）

#### RBAC 权限管理系统 - 第四阶段：权限管理页面（4.3）

**权限配置文件**

1. **权限清单配置** (`src/config/permissions.ts`)
   - 定义系统所有权限的配置清单
   - 权限定义结构：
     - `code: string` - 权限代码（格式：resource:action）
     - `name: string` - 权限名称
     - `resource: string` - 资源类型
     - `action: string` - 操作类型
     - `module: string` - 所属模块
     - `description?: string` - 权限描述
   - 包含 8 个模块的权限：
     - 用户管理（5 个权限）
     - 角色管理（4 个权限）
     - 权限管理（2 个权限）
     - 技能管理（5 个权限）
     - 会话管理（3 个权限）
     - 系统设置（2 个权限）
   - 提供工具函数：
     - `getPermissionsByModule()` - 按模块分组权限
     - `getModules()` - 获取所有模块名称

**权限数据模型**

2. **权限 Schema** (`src/features/permissions/data/schema.ts`)
   - 创建权限数据结构以匹配后端 API
   - 权限字段：
     - `id: string` - 权限 ID（支持 BigInt 自动转换）
     - `code: string` - 权限代码
     - `name: string` - 权限名称
     - `resource: string` - 资源类型
     - `action: string` - 操作类型
     - `module: string` - 所属模块
     - `description: string | null` - 权限描述
     - `createdAt: Date` - 创建时间
     - `updatedAt: Date` - 更新时间
   - 完整的 TypeScript 类型定义

**路由配置**

3. **权限管理路由** (`src/routes/_authenticated/settings/permissions/index.tsx`)
   - 创建权限管理页面路由：`/settings/permissions`
   - 集成 PermissionsPage 组件
   - 使用 TanStack Router 文件系统路由

**核心组件实现**

4. **权限管理主页面** (`src/features/permissions/index.tsx`)
   - 页面标题和描述
   - 集成 SyncPermissionsButton 同步按钮
   - 集成 PermissionsTable 权限列表表格

5. **权限表格组件** (`src/features/permissions/components/permissions-table.tsx`)
   - 使用 TanStack Query 获取权限列表
   - 调用 `/api/permissions` 接口
   - 支持按模块过滤（使用 module 参数）
   - 使用 DataTable 组件展示数据
   - 支持搜索功能（按权限名称）
   - 集成 permissionsColumns 列定义
   - 从配置文件获取模块列表

6. **权限表格列定义** (`src/features/permissions/components/permissions-columns.tsx`)
   - 权限名称列：加粗显示，支持排序
   - 权限代码列：使用 code 标签样式
   - 所属模块列：Badge 显示，支持过滤
   - 资源列：显示资源类型
   - 操作列：显示操作类型
   - 描述列：最大宽度 300px，超出截断

7. **权限同步按钮组件** (`src/features/permissions/components/sync-permissions-button.tsx`)
   - 使用 PermissionGuard 包裹（`permission:sync` 权限）
   - 点击打开确认对话框
   - 显示将要同步的权限数量
   - 从 `src/config/permissions.ts` 读取权限清单
   - 调用 `/api/permissions/sync` 接口同步
   - 使用 TanStack Query mutation 提交数据
   - 成功后自动刷新权限列表
   - 使用 AlertDialog 组件确认操作

**技术特性**
- 权限配置文件集中管理（`src/config/permissions.ts`）
- 权限同步机制（配置文件 → 数据库）
- 按模块分组展示权限
- 支持模块维度过滤
- 细粒度权限控制（同步按钮需要 `permission:sync` 权限）
- 权限守卫组件（PermissionGuard）
- 完整的 TypeScript 类型定义
- 使用 TanStack Query 管理数据状态

**使用场景**
- 权限列表页面展示
- 按模块过滤权限
- 权限同步按钮权限保护
- 从配置文件同步权限到数据库
- 权限配置集中管理

**下一步计划**
- 实现用户角色分配功能
- 实现用户创建/编辑功能（对接后端 API）
- 集成 RBAC 到现有功能模块

---

## [0.1.0] - 2026-01-28

### Added
- 完成数据库设计并添加 RBAC 权限管理规划
- 实现会话数据库持久化功能（Prisma + PostgreSQL）
- 完善技能管理功能并优化用户体验
- 实现平台技能页面功能

### Changed
- 更改系统名称为 SkllsFlow

---

## [0.0.1] - 2026-01-27

### Added
- 项目初始化
- 基础架构搭建（React 19 + Vite + TanStack Router）
- Shadcn UI 组件集成
- AI 对话功能（OpenCode API）
