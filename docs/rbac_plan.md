# RBAC + 用户认证完整实现方案

## 📋 当前项目状态分析

### ✅ 已有基础设施
- Prisma ORM 7.3.0 + PostgreSQL 16 数据库
- Repository 模式基类 ([`server/repositories/base.repository.ts`](../server/repositories/base.repository.ts))
- 前端 auth-store (Zustand)
- 登录页面 UI (使用 mock 数据)
- 后端基础 Express 服务器
- 简单的认证中间件 (非真实验证)

### ❌ 缺失功能
- 真实的用户认证系统 (JWT)
- RBAC 数据库表设计
- 用户、角色、权限管理 API
- 前端路由守卫
- 前端权限控制 (页面级 + 组件级)
- Token 自动刷新机制

---

## 🎯 完整实现任务清单

### 第一阶段: 数据库层设计 (RBAC 模型)

#### 1.1 数据库表设计

**用户表 (`users`)**
- 字段: `id`, `accountNo`(账号), `email`(邮箱), `passwordHash`(密码哈希), `username`(用户名), `avatar`(头像), `status`(状态: active/disabled), `lastLoginAt`, `createdAt`, `updatedAt`, `deletedAt`
- 索引: `accountNo`(唯一), `email`(唯一), `status`

**角色表 (`roles`)**
- 字段: `id`, `name`(角色名称), `code`(角色代码,唯一), `description`(描述), `isSystem`(是否系统内置), `sort`(排序), `status`, `createdAt`, `updatedAt`
- 预置角色: `admin`(管理员), `user`(普通用户), `guest`(访客)

**权限表 (`permissions`)**
- 字段: `id`, `name`(权限名称), `code`(权限代码,如 `user:create`), `resource`(资源,如 `user`), `action`(操作,如 `create`), `description`, `module`(模块), `createdAt`, `updatedAt`
- 权限格式: `资源:操作` (如 `session:create`, `skill:update`)

**用户-角色关联表 (`user_roles`)**
- 字段: `id`, `userId`, `roleId`, `createdAt`
- 约束: 一个用户可以有多个角色

**角色-权限关联表 (`role_permissions`)**
- 字段: `id`, `roleId`, `permissionId`, `createdAt`
- 约束: 一个角色可以有多个权限

**刷新令牌表 (`refresh_tokens`)**
- 字段: `id`, `token`, `userId`, `expiresAt`, `createdAt`, `revokedAt`(撤销时间)
- 用途: JWT 刷新令牌管理

**审计日志表 (`audit_logs`)** - 可选
- 字段: `id`, `userId`, `action`, `resource`, `details`(JSON), `ipAddress`, `userAgent`, `createdAt`

#### 1.2 Prisma Schema 更新
- [ ] 在 [`prisma/schema.prisma`](../prisma/schema.prisma) 中添加上述表定义
- [ ] 配置表关系 (User ↔ UserRole ↔ Role ↔ RolePermission ↔ Permission)
- [ ] 添加必要的复合索引

#### 1.3 数据库迁移
- [ ] 生成 Prisma 迁移文件
- [ ] 执行迁移到 PostgreSQL 数据库

#### 1.4 初始化种子数据
- [ ] 创建管理员账号 (admin/admin123)
- [ ] 预置角色数据 (admin, user, guest)
- [ ] 预置基础权限数据
- [ ] 关联管理员和 admin 角色

---

### 第二阶段: 后端认证系统

#### 2.1 核心服务层

**密码加密服务** (`server/services/auth/password.service.ts`)
- [ ] 使用 bcrypt 进行密码哈希
- [ ] 密码强度验证
- [ ] 密码比对逻辑

**JWT 服务** (`server/services/auth/jwt.service.ts`)
- [ ] 生成 Access Token (有效期 15 分钟)
- [ ] 生成 Refresh Token (有效期 7 天)
- [ ] Token 验证和解码
- [ ] Token 刷新逻辑

**认证服务** (`server/services/auth/auth.service.ts`)
- [ ] 用户登录 (验证密码,生成 token)
- [ ] 用户注册 (创建用户,密码加密)
- [ ] Token 刷新
- [ ] 用户登出 (撤销 refresh token)
- [ ] 获取当前用户信息

#### 2.2 Repository 层

**用户仓储** (`server/repositories/users.repository.ts`)
- [ ] 继承 BaseRepository
- [ ] `findByAccountNo(accountNo)` - 通过账号查找
- [ ] `findByEmail(email)` - 通过邮箱查找
- [ ] `updateLastLogin(userId)` - 更新最后登录时间
- [ ] `findWithRoles(userId)` - 查询用户及其角色

**角色仓储** (`server/repositories/roles.repository.ts`)
- [ ] `findByCode(code)` - 通过角色代码查找
- [ ] `findUserRoles(userId)` - 获取用户的所有角色
- [ ] `findRolePermissions(roleId)` - 获取角色的所有权限

**权限仓储** (`server/repositories/permissions.repository.ts`)
- [ ] `findByCode(code)` - 通过权限代码查找
- [ ] `findUserPermissions(userId)` - 获取用户的所有权限 (通过角色关联)

**刷新令牌仓储** (`server/repositories/refresh-tokens.repository.ts`)
- [ ] `createToken(userId, expiresAt)` - 创建 refresh token
- [ ] `findByToken(token)` - 查询 token
- [ ] `revokeToken(token)` - 撤销 token
- [ ] `deleteExpiredTokens()` - 清理过期 token

#### 2.3 中间件层

**JWT 认证中间件** (`server/middleware/jwt-auth.middleware.ts`)
- [ ] 从 Authorization Header 提取 Bearer token
- [ ] 验证 JWT 签名和有效期
- [ ] 将用户信息注入 `req.user`
- [ ] 错误处理 (401 Unauthorized)

**RBAC 权限中间件** (`server/middleware/rbac.middleware.ts`)
- [ ] `requirePermissions(...permissions)` - 检查用户是否拥有指定权限
- [ ] `requireRoles(...roles)` - 检查用户是否拥有指定角色
- [ ] `requireOwnership` - 检查资源所有权 (可选)
- [ ] 支持权限逻辑运算 (AND/OR)

#### 2.4 控制器层

**认证控制器** (`server/controllers/auth.controller.ts`)
- [ ] `POST /api/auth/register` - 用户注册
- [ ] `POST /api/auth/login` - 用户登录
- [ ] `POST /api/auth/logout` - 用户登出
- [ ] `POST /api/auth/refresh` - 刷新 token
- [ ] `GET /api/auth/me` - 获取当前用户信息

**用户管理控制器** (`server/controllers/users.controller.ts`)
- [ ] `GET /api/users` - 获取用户列表 (分页)
- [ ] `GET /api/users/:id` - 获取用户详情
- [ ] `PUT /api/users/:id` - 更新用户信息
- [ ] `DELETE /api/users/:id` - 删除用户
- [ ] `PUT /api/users/:id/roles` - 分配角色

**角色管理控制器** (`server/controllers/roles.controller.ts`)
- [ ] `GET /api/roles` - 获取角色列表
- [ ] `POST /api/roles` - 创建角色
- [ ] `GET /api/roles/:id` - 获取角色详情
- [ ] `PUT /api/roles/:id` - 更新角色
- [ ] `DELETE /api/roles/:id` - 删除角色
- [ ] `PUT /api/roles/:id/permissions` - 分配权限

**权限管理控制器** (`server/controllers/permissions.controller.ts`)
- [ ] `GET /api/permissions` - 获取权限列表 (按模块分组)
- [ ] `GET /api/permissions/check` - 检查用户是否拥有指定权限

#### 2.5 路由层
- [ ] **认证路由** (`server/routes/auth.routes.ts`)
- [ ] **用户路由** (`server/routes/users.routes.ts`) + 应用 RBAC 中间件
- [ ] **角色路由** (`server/routes/roles.routes.ts`) + 应用 RBAC 中间件
- [ ] **权限路由** (`server/routes/permissions.routes.ts`) + 应用 RBAC 中间件

#### 2.6 服务器集成
- [ ] 在 [`server/index.ts`](../server/index.ts) 中注册新路由
- [ ] 配置 JWT 环境变量 (`JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`)
- [ ] 更新 CORS 配置 (支持 credentials)

---

### 第三阶段: 前端认证系统

#### 3.1 核心 Hooks 和工具

**认证 Hook** (`src/hooks/use-auth.ts`)
- [ ] `useAuth()` - 获取认证状态和用户信息
- [ ] `useLogin()` - 登录 mutation
- [ ] `useLogout()` - 登出 mutation
- [ ] `useRegister()` - 注册 mutation
- [ ] `useRefreshToken()` - Token 刷新逻辑

**权限 Hook** (`src/hooks/use-permissions.ts`)
- [ ] `useHasPermission(permission)` - 检查是否拥有单个权限
- [ ] `useHasAllPermissions(...permissions)` - 检查是否拥有所有权限
- [ ] `useHasAnyPermission(...permissions)` - 检查是否拥有任一权限
- [ ] `useUserPermissions()` - 获取用户所有权限列表

**角色 Hook** (`src/hooks/use-roles.ts`)
- [ ] `useHasRole(role)` - 检查是否拥有角色
- [ ] `useHasAnyRole(...roles)` - 检查是否拥有任一角色

**API 客户端配置** (`src/lib/api-client.ts`)
- [ ] 配置 Axios 拦截器
- [ ] 请求拦截器: 自动添加 Authorization Header
- [ ] 响应拦截器: 401 错误时自动刷新 token
- [ ] Token 过期处理逻辑

#### 3.2 Store 更新

**更新 Auth Store** ([`src/stores/auth-store.ts`](../src/stores/auth-store.ts))
- [ ] 添加 `refreshToken` 字段
- [ ] 添加 `userPermissions` 和 `userRoles` 缓存
- [ ] 实现 `refreshAccessToken()` action
- [ ] 实现 `loadUserPermissions()` action

#### 3.3 路由守卫

**认证路由守卫** (`src/routes/__root.tsx`)
- [ ] 在 `beforeLoad` 中检查认证状态
- [ ] 未认证用户重定向到登录页
- [ ] 保存原始目标路径 (登录后跳转)

**权限路由守卫** (`src/routes/_authenticated/route.tsx`)
- [ ] 在 `beforeLoad` 中检查用户权限
- [ ] 权限不足重定向到 403 页面
- [ ] 支持路由级别的权限配置

#### 3.4 登录页面重构

**更新登录表单** ([`src/features/auth/sign-in/components/user-auth-form.tsx`](../src/features/auth/sign-in/components/user-auth-form.tsx))
- [ ] 移除 mock 数据
- [ ] 集成真实的登录 API
- [ ] 添加错误处理
- [ ] 添加"记住我"功能

**注册页面** (新建 `src/features/auth/sign-up/index.tsx`)
- [ ] 用户注册表单
- [ ] 邮箱验证 (可选)
- [ ] 密码强度提示

#### 3.5 认证相关组件

**受保护路由组件** (`src/components/auth/protected-route.tsx`)
- [ ] 包装需要认证的路由
- [ ] 支持权限检查

**权限控制组件** (`src/components/auth/permission-guard.tsx`)
```tsx
<PermissionGuard permission="user:create">
   <Button>创建用户</Button>
</PermissionGuard>
```

**角色控制组件** (`src/components/auth/role-guard.tsx`)
```tsx
<RoleGuard roles={['admin']}>
   <AdminPanel />
</RoleGuard>
```

---

### 第四阶段: 管理功能页面

#### 4.1 用户管理页面

**用户列表页** ([`src/routes/_authenticated/users/index.tsx`](../src/routes/_authenticated/users/index.tsx) 已存在,需重构)
- [ ] 数据表格组件 (展示用户信息)
- [ ] 搜索和筛选功能
- [ ] 分页功能
- [ ] 创建/编辑/删除用户按钮 (权限控制)
- [ ] 显示用户角色

**用户创建/编辑表单**
- [ ] 账号、邮箱、密码 (创建时)
- [ ] 用户名、头像
- [ ] 角色分配 (多选)
- [ ] 状态设置 (active/disabled)

**用户详情页**
- [ ] 用户基本信息
- [ ] 角色列表
- [ ] 权限列表
- [ ] 操作历史 (可选)

#### 4.2 角色管理页面

**角色列表页** (新建 `src/routes/_authenticated/settings/roles/index.tsx`)
- [ ] 数据表格展示角色
- [ ] 角色代码、名称、描述
- [ ] 创建/编辑/删除角色
- [ ] 权限配置入口

**角色创建/编辑表单**
- [ ] 角色代码 (唯一)
- [ ] 角色名称
- [ ] 描述
- [ ] 权限配置 (树形多选)
- [ ] 排序

**权限配置组件** (`src/components/settings/permission-tree.tsx`)
- [ ] 按模块分组的权限树
- [ ] 支持全选/反选
- [ ] 权限说明提示

#### 4.3 权限管理页面 (可选)

**权限列表页** (`src/routes/_authenticated/settings/permissions/index.tsx`)
- [ ] 查看所有权限
- [ ] 按模块分组展示
- [ ] 权限代码和描述

---

### 第五阶段: 现有功能集成 RBAC

#### 5.1 会话管理权限
- [ ] **会话创建权限** (`session:create`) - 在 [`智能对话页面`](../src/routes/_authenticated/ai-chat/index.tsx) 添加权限检查
- [ ] **会话删除权限** (`session:delete`) - 控制删除会话按钮显示
- [ ] **会话更新权限** (`session:update`) - 控制会话重命名功能

#### 5.2 技能管理权限
- [ ] `skill:view` - 技能查看权限
- [ ] `skill:create` - 技能创建权限
- [ ] `skill:update` - 技能更新权限
- [ ] `skill:delete` - 技能删除权限
- [ ] `skill:install` - 技能装载权限
- [ ] `skill:uninstall` - 技能卸载权限

#### 5.3 MCP 管理权限
- [ ] `mcp:view`, `mcp:create`, `mcp:update`, `mcp:delete`

#### 5.4 Agent 管理权限
- [ ] `agent:view`, `agent:create`, `agent:update`, `agent:delete`

#### 5.5 用户管理权限
- [ ] `user:view`, `user:create`, `user:update`, `user:delete`
- [ ] `user:assign-roles` - 分配角色权限

#### 5.6 角色管理权限
- [ ] `role:view`, `role:create`, `role:update`, `role:delete`
- [ ] `role:assign-permissions` - 分配权限权限

---

### 第六阶段: 安全增强

#### 6.1 密码策略
- [ ] 密码复杂度要求 (最少 8 位,包含大小写字母、数字)
- [ ] 密码历史记录 (禁止重复使用最近 5 次密码)
- [ ] 账户锁定机制 (5 次失败后锁定 30 分钟)

#### 6.2 Token 安全
- [ ] Access Token 短期有效期 (15 分钟)
- [ ] Refresh Token 长期有效期 (7 天)
- [ ] Token 黑名单机制 (登出时)
- [ ] Token 轮换机制 (刷新时旧 token 失效)

#### 6.3 审计日志
- [ ] 记录用户登录/登出
- [ ] 记录权限变更
- [ ] 记录敏感操作 (创建/删除用户等)
- [ ] IP 地址和 User Agent 记录

#### 6.4 环境变量配置

**在 `.env` 中添加认证相关配置**
```bash
# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# 认证开关
REQUIRE_AUTH=true
```

---

### 第七阶段: 测试和文档

#### 7.1 单元测试
- [ ] 密码加密服务测试
- [ ] JWT 服务测试
- [ ] 认证服务测试
- [ ] 权限中间件测试

#### 7.2 集成测试
- [ ] 登录流程测试
- [ ] Token 刷新测试
- [ ] 权限检查测试

#### 7.3 API 文档
- [ ] 添加认证相关 API 文档
- [ ] 添加 RBAC 权限说明

#### 7.4 使用文档
- [ ] 创建 `docs/rbac-implementation.md`
- [ ] 数据库 ER 图
- [ ] 权限设计说明
- [ ] 使用示例

---

## 📊 任务优先级建议

### P0 (核心功能,必须优先实现)
1. 数据库表设计 + Prisma Schema
2. 后端认证服务 (密码 + JWT)
3. 用户登录/注册 API
4. 前端登录页面 + Auth Store 更新
5. JWT 认证中间件 + 路由守卫

### P1 (RBAC 核心功能)
6. 角色和权限表 + Repository
7. RBAC 中间件
8. 用户/角色/权限管理 API
9. 前端权限 Hook 和组件
10. 用户管理页面

### P2 (增强功能)
11. 现有功能集成 RBAC
12. Token 刷新机制
13. 审计日志
14. 角色和权限管理页面

### P3 (可选功能)
15. 密码策略增强
16. 审计日志展示页面
17. 单元测试

---

## 🔧 推荐实现顺序

**第 1 周**: 第一阶段 (数据库) + 第二阶段 2.1-2.2 (服务层)
**第 2 周**: 第二阶段 2.3-2.6 (后端完整功能)
**第 3 周**: 第三阶段 (前端认证系统)
**第 4 周**: 第四阶段 (用户管理) + 第五阶段 (集成 RBAC)
**第 5 周**: 第六阶段 (安全增强) + 第七阶段 (测试文档)

---

## 📁 文件结构预览

### 后端文件结构
```
server/
├── services/
│   └── auth/
│       ├── password.service.ts
│       ├── jwt.service.ts
│       └── auth.service.ts
├── repositories/
│   ├── users.repository.ts
│   ├── roles.repository.ts
│   ├── permissions.repository.ts
│   └── refresh-tokens.repository.ts
├── middleware/
│   ├── jwt-auth.middleware.ts
│   └── rbac.middleware.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── users.controller.ts
│   ├── roles.controller.ts
│   └── permissions.controller.ts
└── routes/
    ├── auth.routes.ts
    ├── users.routes.ts
    ├── roles.routes.ts
    └── permissions.routes.ts
```

### 前端文件结构
```
src/
├── hooks/
│   ├── use-auth.ts
│   ├── use-permissions.ts
│   └── use-roles.ts
├── features/
│   ├── auth/
│   │   ├── sign-in/
│   │   └── sign-up/
│   └── users/
│       ├── index.tsx
│       └── components/
├── components/
│   └── auth/
│       ├── protected-route.tsx
│       ├── permission-guard.tsx
│       └── role-guard.tsx
└── routes/
    └── _authenticated/
        └── settings/
            ├── roles/
            └── permissions/
```

---

## 🔐 安全最佳实践

1. **永远不要**在代码中硬编码密钥或密码
2. **始终使用** bcrypt 加密密码 (工作因子 10-12)
3. **使用 HTTPS** 在生产环境中传输敏感数据
4. **实施速率限制** 防止暴力破解攻击
5. **定期轮换** JWT 密钥
6. **记录所有** 安全相关事件 (登录、权限变更等)
7. **实施最小权限原则** - 用户只拥有完成工作所需的最小权限
8. **定期审计** 用户权限和角色分配

---

## 📚 参考资料

- [Prisma 文档](https://www.prisma.io/docs)
- [JWT 最佳实践](https://tools.ietf.org/html/rfc8725)
- [OWASP 认证备忘单](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [RBAC 设计模式](https://en.wikipedia.org/wiki/Role-based_access_control)

---

**文档生成时间**: 2026-01-28
**项目**: SkllsFlow AIOps 智能平台
**版本**: 1.0.0
