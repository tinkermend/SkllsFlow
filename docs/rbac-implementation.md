# RBAC 权限管理系统实现文档

## 📋 目录

- [概述](#概述)
- [数据库设计](#数据库设计)
- [权限设计](#权限设计)
- [认证流程](#认证流程)
- [权限验证流程](#权限验证流程)
- [API 接口](#api-接口)
- [前端集成](#前端集成)
- [常见问题](#常见问题)
- [故障排查](#故障排查)

---

## 概述

本系统实现了基于角色的访问控制 (RBAC - Role-Based Access Control)，提供完整的用户认证、角色管理和权限控制功能。

### 核心特性

- **用户认证**: JWT + Refresh Token 双令牌机制
- **角色管理**: 支持多角色分配，系统内置角色保护
- **权限控制**: 细粒度的资源-操作权限模型
- **安全防护**: 密码加密、账户锁定、令牌轮换
- **审计日志**: 完整的操作审计追踪
- **前端集成**: CASL 权限判断 + 组件级权限守卫

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 数据库 | PostgreSQL 16 + Prisma ORM | 关系型数据库 + ORM |
| 后端 | Node.js + Express + TypeScript | RESTful API |
| 认证 | JWT + bcrypt | 令牌认证 + 密码加密 |
| 前端 | React 19 + TanStack Router | SPA 应用 |
| 权限 | CASL | 前端权限判断库 |

---

## 数据库设计

### ER 图

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │────────▶│  UserRole    │◀────────│    Role     │
│             │  1:N    │              │  N:1    │             │
│ - id        │         │ - userId     │         │ - id        │
│ - accountNo │         │ - roleId     │         │ - code      │
│ - email     │         └──────────────┘         │ - name      │
│ - password  │                                   │ - isSystem  │
│ - status    │                                   └──────┬──────┘
└──────┬──────┘                                          │
       │                                                 │ 1:N
       │ 1:N                                             ▼
       │                                   ┌──────────────────────┐
       │                                   │  RolePermission      │
       │                                   │                      │
       │                                   │ - roleId             │
       │                                   │ - permissionId       │
       │                                   └──────────┬───────────┘
       │                                              │ N:1
       │                                              ▼
       │                                   ┌─────────────────┐
       │                                   │   Permission    │
       │                                   │                 │
       │                                   │ - id            │
       │                                   │ - code          │
       │                                   │ - resource      │
       │                                   │ - action        │
       │                                   │ - module        │
       │                                   └─────────────────┘
       │
       │ 1:N
       ▼
┌──────────────────┐
│  RefreshToken    │
│                  │
│ - tokenHash      │
│ - userId         │
│ - deviceId       │
│ - expiresAt      │
│ - revokedAt      │
└──────────────────┘
```

### 核心表结构

#### 1. users 表

用户基础信息表，存储账号、邮箱、密码等核心数据。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt | 主键 |
| account_no | String | 账号（唯一） |
| email | String | 邮箱（唯一） |
| password_hash | String | 密码哈希 |
| username | String? | 用户名 |
| avatar | String? | 头像 URL |
| status | user_status | 状态（active/disabled） |
| last_login_at | DateTime? | 最后登录时间 |
| login_failed_count | Int | 登录失败次数 |
| locked_until | DateTime? | 锁定截止时间 |

**索引**:
- `account_no` (唯一索引)
- `email` (唯一索引)
- `status` (普通索引)

**安全特性**:
- 密码使用 bcrypt 加密（成本因子 12）
- 登录失败 5 次后锁定账户 15 分钟
- 支持账户启用/禁用状态控制

#### 2. roles 表

角色定义表，存储系统中的所有角色信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt | 主键 |
| name | String | 角色名称 |
| code | String | 角色代码（唯一，如 admin, user） |
| description | String? | 角色描述 |
| is_system | Boolean | 是否系统内置角色 |
| sort | Int | 排序权重 |
| status | role_status | 状态（active/disabled） |

**索引**:
- `code` (唯一索引)
- `status` (普通索引)

**系统内置角色**:
- `admin`: 超级管理员，拥有所有权限
- `user`: 普通用户，基础权限

**保护机制**:
- 系统内置角色（`is_system = true`）不可删除
- 角色代码不可修改

#### 3. permissions 表

权限定义表，存储系统中的所有权限配置。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt | 主键 |
| name | String | 权限名称 |
| code | String | 权限代码（唯一，如 user:create） |
| resource | String | 资源类型（如 user, role） |
| action | String | 操作类型（如 create, read） |
| module | String | 所属模块（如 用户管理） |
| description | String? | 权限描述 |

**索引**:
- `code` (唯一索引)
- `module` (普通索引)

**权限命名规范**:
- 格式: `resource:action`
- 示例: `user:create`, `role:update`, `session:delete`

**权限同步**:
- 权限配置定义在 `src/config/permissions.ts`
- 通过同步接口将配置同步到数据库
- 已存在的权限会更新，新权限会创建

#### 4. user_roles 表

用户-角色关联表，实现用户与角色的多对多关系。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt | 主键 |
| user_id | BigInt | 用户 ID（外键） |
| role_id | BigInt | 角色 ID（外键） |
| created_at | DateTime | 创建时间 |

**索引**:
- `(user_id, role_id)` (唯一索引)
- `user_id` (普通索引)
- `role_id` (普通索引)

**级联删除**:
- 删除用户时，自动删除关联记录
- 删除角色时，自动删除关联记录

#### 5. role_permissions 表

角色-权限关联表，实现角色与权限的多对多关系。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt | 主键 |
| role_id | BigInt | 角色 ID（外键） |
| permission_id | BigInt | 权限 ID（外键） |
| created_at | DateTime | 创建时间 |

**索引**:
- `(role_id, permission_id)` (唯一索引)
- `role_id` (普通索引)
- `permission_id` (普通索引)

**级联删除**:
- 删除角色时，自动删除关联记录
- 删除权限时，自动删除关联记录

#### 6. refresh_tokens 表

刷新令牌表，存储用户的刷新令牌信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt | 主键 |
| token_hash | String | 令牌哈希（唯一） |
| user_id | BigInt | 用户 ID（外键） |
| device_id | String? | 设备指纹 |
| ip_address | String? | 登录 IP |
| user_agent | String? | User Agent |
| expires_at | DateTime | 过期时间 |
| rotated_at | DateTime? | 轮换时间 |
| revoked_at | DateTime? | 撤销时间 |

**索引**:
- `token_hash` (唯一索引)
- `user_id` (普通索引)
- `device_id` (普通索引)

**安全机制**:
- 令牌使用 SHA-256 哈希存储
- 支持令牌轮换（Refresh Token Rotation）
- 支持手动撤销令牌
- 过期时间默认 7 天

#### 7. audit_logs 表

审计日志表，记录系统中的所有重要操作。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BigInt | 主键 |
| user_id | BigInt? | 操作用户 ID |
| action | String | 操作类型 |
| resource | String | 资源类型 |
| resource_id | String? | 资源 ID |
| details | Json? | 操作详情 |
| ip_address | String? | IP 地址 |
| user_agent | String? | User Agent |
| created_at | DateTime | 创建时间 |

**索引**:
- `user_id` (普通索引)
- `action` (普通索引)
- `resource` (普通索引)
- `created_at` (普通索引)

**记录的操作**:
- 用户登录/登出
- 用户创建/更新/删除
- 角色创建/更新/删除
- 权限分配/撤销

---

## 权限设计

### 权限模型

本系统采用 **资源-操作** 权限模型，权限代码格式为 `resource:action`。

### 权限配置文件

权限配置集中管理在 [src/config/permissions.ts](../src/config/permissions.ts)，包含 21 个权限，分布在 8 个模块中。

```typescript
export type PermissionDefinition = {
  code: string        // 权限代码，如 user:create
  name: string        // 权限名称，如 创建用户
  resource: string    // 资源类型，如 user
  action: string      // 操作类型，如 create
  module: string      // 所属模块，如 用户管理
  description?: string // 权限描述
}
```

### 权限列表

#### 用户管理模块 (5 个权限)

| 权限代码 | 权限名称 | 说明 |
|---------|---------|------|
| user:view | 查看用户 | 查看用户列表和详情 |
| user:create | 创建用户 | 创建新用户 |
| user:update | 更新用户 | 更新用户信息 |
| user:delete | 删除用户 | 删除用户 |
| user:assign-role | 分配角色 | 为用户分配角色 |

#### 角色管理模块 (4 个权限)

| 权限代码 | 权限名称 | 说明 |
|---------|---------|------|
| role:view | 查看角色 | 查看角色列表和详情 |
| role:create | 创建角色 | 创建新角色 |
| role:update | 更新角色 | 更新角色信息 |
| role:delete | 删除角色 | 删除角色 |

#### 权限管理模块 (2 个权限)

| 权限代码 | 权限名称 | 说明 |
|---------|---------|------|
| permission:view | 查看权限 | 查看权限列表和详情 |
| permission:sync | 同步权限 | 从配置文件同步权限到数据库 |

#### 技能管理模块 (5 个权限)

| 权限代码 | 权限名称 | 说明 |
|---------|---------|------|
| skill:view | 查看技能 | 查看技能列表和详情 |
| skill:create | 创建技能 | 创建新技能 |
| skill:update | 更新技能 | 更新技能信息 |
| skill:delete | 删除技能 | 删除技能 |
| skill:execute | 执行技能 | 执行技能操作 |

#### 会话管理模块 (3 个权限)

| 权限代码 | 权限名称 | 说明 |
|---------|---------|------|
| session:view | 查看会话 | 查看会话列表和详情 |
| session:create | 创建会话 | 创建新会话 |
| session:delete | 删除会话 | 删除会话 |

#### 系统设置模块 (2 个权限)

| 权限代码 | 权限名称 | 说明 |
|---------|---------|------|
| settings:view | 查看设置 | 查看系统设置 |
| settings:update | 更新设置 | 更新系统设置 |

### 权限同步流程

1. 管理员在权限管理页面点击"同步权限"按钮
2. 系统读取 `src/config/permissions.ts` 中的权限配置
3. 调用 `POST /api/permissions/sync` 接口
4. 后端遍历权限配置：
   - 如果权限代码已存在，更新权限信息
   - 如果权限代码不存在，创建新权限
5. 返回同步结果

---

## 认证流程

### 登录流程

```
┌─────────┐                ┌─────────┐                ┌──────────┐
│ 前端    │                │ 后端    │                │ 数据库   │
└────┬────┘                └────┬────┘                └────┬─────┘
     │                          │                          │
     │ 1. POST /api/auth/login  │                          │
     │ { accountNo, password }  │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ 2. 查询用户              │
     │                          ├─────────────────────────>│
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │ 3. 验证密码 (bcrypt)     │
     │                          │                          │
     │                          │ 4. 检查账户状态          │
     │                          │    - 是否禁用            │
     │                          │    - 是否锁定            │
     │                          │                          │
     │                          │ 5. 查询用户角色和权限    │
     │                          ├─────────────────────────>│
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │ 6. 生成 Access Token     │
     │                          │    (15分钟有效期)        │
     │                          │                          │
     │                          │ 7. 生成 Refresh Token    │
     │                          │    (7天有效期)           │
     │                          │                          │
     │                          │ 8. 保存 Refresh Token    │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │ 9. 更新登录信息          │
     │                          ├─────────────────────────>│
     │                          │                          │
     │ 10. 返回令牌和用户信息   │                          │
     │<─────────────────────────┤                          │
     │ { accessToken, user }    │                          │
     │ Set-Cookie: refreshToken │                          │
     │                          │                          │
     │ 11. 保存到本地存储       │                          │
     │                          │                          │
```

### 令牌刷新流程

```
┌─────────┐                ┌─────────┐                ┌──────────┐
│ 前端    │                │ 后端    │                │ 数据库   │
└────┬────┘                └────┬────┘                └────┬─────┘
     │                          │                          │
     │ 1. POST /api/auth/refresh│                          │
     │ Cookie: refreshToken     │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ 2. 验证 Refresh Token    │
     │                          │    - 检查签名            │
     │                          │    - 检查过期时间        │
     │                          │                          │
     │                          │ 3. 查询令牌记录          │
     │                          ├─────────────────────────>│
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │ 4. 检查令牌状态          │
     │                          │    - 是否已撤销          │
     │                          │    - 是否已轮换          │
     │                          │                          │
     │                          │ 5. 查询用户和权限        │
     │                          ├─────────────────────────>│
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │ 6. 生成新 Access Token   │
     │                          │                          │
     │                          │ 7. 生成新 Refresh Token  │
     │                          │    (令牌轮换)            │
     │                          │                          │
     │                          │ 8. 标记旧令牌为已轮换    │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │ 9. 保存新令牌            │
     │                          ├─────────────────────────>│
     │                          │                          │
     │ 10. 返回新令牌           │                          │
     │<─────────────────────────┤                          │
     │ { accessToken }          │                          │
     │ Set-Cookie: refreshToken │                          │
     │                          │                          │
```

### 登出流程

```
┌─────────┐                ┌─────────┐                ┌──────────┐
│ 前端    │                │ 后端    │                │ 数据库   │
└────┬────┘                └────┬────┘                └────┬─────┘
     │                          │                          │
     │ 1. POST /api/auth/logout │                          │
     │ Cookie: refreshToken     │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ 2. 撤销 Refresh Token    │
     │                          ├─────────────────────────>│
     │                          │                          │
     │ 3. 清除本地令牌          │                          │
     │<─────────────────────────┤                          │
     │ Clear-Cookie             │                          │
     │                          │                          │
```

---

## 权限验证流程

### 后端权限验证

```
┌─────────┐                ┌─────────────┐                ┌──────────┐
│ 客户端  │                │ 权限中间件  │                │ 控制器   │
└────┬────┘                └──────┬──────┘                └────┬─────┘
     │                            │                            │
     │ 1. API 请求                │                            │
     │ Authorization: Bearer xxx  │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │ 2. 验证 Access Token       │
     │                            │    - 检查签名              │
     │                            │    - 检查过期时间          │
     │                            │                            │
     │                            │ 3. 解析用户信息            │
     │                            │    - userId                │
     │                            │    - permissions[]         │
     │                            │                            │
     │                            │ 4. 检查权限                │
     │                            │    - 是否包含所需权限      │
     │                            │                            │
     │                            │ 5. 权限验证通过            │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │                            │ 6. 执行业务逻辑
     │                            │                            │
     │                            │                            │
     │ 7. 返回结果                │                            │
     │<───────────────────────────┴────────────────────────────┤
     │                                                         │
```

### 前端权限验证

前端使用 CASL 库进行权限判断，支持两种验证方式：

#### 1. 组件级权限守卫

```tsx
import { PermissionGuard } from '@/components/permission-guard'

<PermissionGuard permission="user:create">
  <Button>创建用户</Button>
</PermissionGuard>
```

#### 2. 编程式权限判断

```tsx
import { useAbility } from '@/hooks/use-ability'

function MyComponent() {
  const ability = useAbility()

  if (ability.can('create', 'user')) {
    // 显示创建按钮
  }
}
```

---

## API 接口

### 认证接口

#### POST /api/auth/login

用户登录接口。

**请求体**:
```json
{
  "accountNo": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "accountNo": "admin",
    "email": "admin@example.com",
    "username": "管理员",
    "avatar": null,
    "status": "active",
    "roles": [
      {
        "id": "1",
        "code": "admin",
        "name": "超级管理员"
      }
    ],
    "permissions": ["user:view", "user:create", ...]
  }
}
```

**Cookie**:
- `refreshToken`: HttpOnly, Secure, SameSite=Strict

#### POST /api/auth/refresh

刷新访问令牌接口。

**请求**:
- Cookie: `refreshToken`

**响应**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Cookie**:
- 新的 `refreshToken` (令牌轮换)

#### POST /api/auth/logout

用户登出接口。

**请求**:
- Cookie: `refreshToken`

**响应**:
```json
{
  "message": "登出成功"
}
```

#### GET /api/auth/me

获取当前用户信息接口。

**请求头**:
- `Authorization: Bearer {accessToken}`

**响应**:
```json
{
  "id": "1",
  "accountNo": "admin",
  "email": "admin@example.com",
  "username": "管理员",
  "avatar": null,
  "status": "active",
  "roles": [...],
  "permissions": [...]
}
```

### 用户管理接口

#### GET /api/users

获取用户列表。

**权限**: `user:view`

**查询参数**:
- `page`: 页码（默认 1）
- `pageSize`: 每页数量（默认 10）
- `search`: 搜索关键词
- `status`: 状态筛选

**响应**:
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

#### POST /api/users

创建用户。

**权限**: `user:create`

**请求体**:
```json
{
  "accountNo": "user001",
  "email": "user@example.com",
  "password": "password123",
  "username": "用户名",
  "roleIds": [2]
}
```

#### PUT /api/users/:id

更新用户信息。

**权限**: `user:update`

#### DELETE /api/users/:id

删除用户。

**权限**: `user:delete`

### 角色管理接口

#### GET /api/roles

获取角色列表。

**权限**: `role:view`

**响应**:
```json
{
  "data": [
    {
      "id": "1",
      "code": "admin",
      "name": "超级管理员",
      "description": "拥有所有权限",
      "isSystem": true,
      "status": "active",
      "permissions": [...]
    }
  ]
}
```

#### POST /api/roles

创建角色。

**权限**: `role:create`

**请求体**:
```json
{
  "code": "editor",
  "name": "编辑员",
  "description": "内容编辑权限",
  "permissionIds": [1, 2, 3]
}
```

#### PUT /api/roles/:id

更新角色信息。

**权限**: `role:update`

#### DELETE /api/roles/:id

删除角色。

**权限**: `role:delete`

**限制**: 系统内置角色不可删除

### 权限管理接口

#### GET /api/permissions

获取权限列表。

**权限**: `permission:view`

**查询参数**:
- `module`: 模块筛选

**响应**:
```json
{
  "data": [
    {
      "id": "1",
      "code": "user:view",
      "name": "查看用户",
      "resource": "user",
      "action": "view",
      "module": "用户管理",
      "description": "查看用户列表和详情"
    }
  ]
}
```

#### POST /api/permissions/sync

同步权限配置到数据库。

**权限**: `permission:sync`

**请求体**:
```json
{
  "permissions": [
    {
      "code": "user:view",
      "name": "查看用户",
      "resource": "user",
      "action": "view",
      "module": "用户管理",
      "description": "查看用户列表和详情"
    }
  ]
}
```

---

## 前端集成

### 认证状态管理

使用 Zustand 管理认证状态 ([src/stores/auth-store.ts](../src/stores/auth-store.ts))。

```typescript
interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (credentials) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}
```

### CASL 权限配置

使用 CASL 进行前端权限判断 ([src/lib/ability.ts](../src/lib/ability.ts))。

```typescript
import { AbilityBuilder, PureAbility } from '@casl/ability'

export function defineAbilityFor(permissions: string[]) {
  const { can, build } = new AbilityBuilder(PureAbility)

  permissions.forEach((permission) => {
    const [action, resource] = permission.split(':')
    can(action, resource)
  })

  return build()
}
```

### 权限守卫组件

#### PermissionGuard

用于包裹需要权限控制的组件。

```tsx
import { PermissionGuard } from '@/components/permission-guard'

<PermissionGuard permission="user:create">
  <Button>创建用户</Button>
</PermissionGuard>
```

**实现位置**: [src/components/permission-guard.tsx](../src/components/permission-guard.tsx)

#### RoleGuard

用于基于角色的访问控制。

```tsx
import { RoleGuard } from '@/components/role-guard'

<RoleGuard role="admin">
  <AdminPanel />
</RoleGuard>
```

### 路由保护

使用 TanStack Router 的路由守卫保护需要认证的路由。

```typescript
// src/routes/_authenticated.tsx
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
})
```

---

## 常见问题

### Q1: 如何添加新的权限？

1. 在 [src/config/permissions.ts](../src/config/permissions.ts) 中添加权限定义
2. 在权限管理页面点击"同步权限"按钮
3. 在角色管理页面为角色分配新权限

### Q2: 如何修改 Access Token 的有效期？

修改 [server/config/env.ts](../server/config/env.ts) 中的 `JWT_EXPIRES_IN` 环境变量。

```typescript
JWT_EXPIRES_IN: z.string().default('15m')
```

### Q3: 如何修改账户锁定策略？

修改 [server/services/auth/auth.service.ts](../server/services/auth/auth.service.ts) 中的常量：

```typescript
const MAX_LOGIN_ATTEMPTS = 5      // 最大失败次数
const LOCK_DURATION_MINUTES = 15  // 锁定时长（分钟）
```

### Q4: 如何为用户分配角色？

1. 在用户管理页面找到目标用户
2. 点击"编辑"按钮
3. 在角色选择器中选择要分配的角色
4. 保存更改

或通过 API:
```bash
PUT /api/users/:id
{
  "roleIds": [1, 2]
}
```

### Q5: 如何查看用户的权限？

用户的权限是通过角色继承的。查看步骤：
1. 查看用户拥有的角色
2. 查看每个角色拥有的权限
3. 用户的最终权限 = 所有角色权限的并集

### Q6: 系统内置角色可以修改吗？

- 可以修改角色名称和描述
- 可以修改角色的权限分配
- 不可以删除系统内置角色
- 不可以修改角色代码

### Q7: Refresh Token 什么时候会失效？

Refresh Token 在以下情况会失效：
- 超过有效期（默认 7 天）
- 用户主动登出
- 管理员撤销令牌
- 令牌被轮换后（旧令牌失效）

---

## 故障排查

### 问题 1: 登录后提示 "账户已被锁定"

**原因**: 登录失败次数超过限制（默认 5 次）

**解决方案**:
1. 等待锁定时间结束（默认 15 分钟）
2. 或联系管理员手动解锁：
```sql
UPDATE aiops.users
SET login_failed_count = 0, locked_until = NULL
WHERE account_no = 'xxx';
```

### 问题 2: Access Token 过期后无法自动刷新

**可能原因**:
- Refresh Token 已过期
- Refresh Token 已被撤销
- Cookie 未正确发送

**排查步骤**:
1. 检查浏览器 Cookie 中是否有 `refreshToken`
2. 检查 Refresh Token 是否过期
3. 查看浏览器控制台网络请求，确认 Cookie 是否发送
4. 检查后端日志，查看刷新请求是否到达

### 问题 3: 权限验证失败，提示 "权限不足"

**可能原因**:
- 用户未分配相应角色
- 角色未分配相应权限
- 权限代码不匹配

**排查步骤**:
1. 检查用户拥有的角色：
```sql
SELECT r.* FROM aiops.roles r
JOIN aiops.user_roles ur ON r.id = ur.role_id
WHERE ur.user_id = xxx;
```

2. 检查角色拥有的权限：
```sql
SELECT p.* FROM aiops.permissions p
JOIN aiops.role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = xxx;
```

3. 确认权限代码是否正确（格式：`resource:action`）

### 问题 4: 权限同步失败

**可能原因**:
- 数据库连接失败
- 权限配置格式错误
- 权限代码重复

**解决方案**:
1. 检查数据库连接状态
2. 验证 `src/config/permissions.ts` 中的权限配置格式
3. 确保权限代码唯一
4. 查看后端日志获取详细错误信息

### 问题 5: 前端权限守卫不生效

**可能原因**:
- CASL Ability 未正确初始化
- 权限格式不匹配
- 用户权限未正确加载

**排查步骤**:
1. 检查用户登录后权限是否正确加载到 AuthStore
2. 确认 CASL Ability 是否正确初始化
3. 检查权限守卫中的权限代码格式
4. 使用浏览器开发工具查看 `ability.can()` 的返回值

### 问题 6: 无法删除系统内置角色

**原因**: 系统内置角色受保护，不允许删除

**解决方案**:
- 这是预期行为，系统内置角色（`is_system = true`）不可删除
- 如需修改，可以更新角色的权限分配
- 如确实需要删除，需要先在数据库中将 `is_system` 设置为 `false`

---

## 安全建议

### 1. 密码安全

- 强制使用强密码策略（最少 8 位，包含大小写字母、数字）
- 定期提醒用户更换密码
- 禁止使用常见弱密码
- 密码哈希使用 bcrypt，成本因子不低于 12

### 2. 令牌安全

- Access Token 有效期不宜过长（推荐 15 分钟）
- Refresh Token 使用 HttpOnly Cookie 存储
- 启用令牌轮换机制
- 定期清理过期令牌
- 生产环境必须使用 HTTPS

### 3. 权限控制

- 遵循最小权限原则
- 定期审查用户权限
- 重要操作需要二次确认
- 记录所有权限变更操作
- 前后端都要进行权限验证

### 4. 审计日志

- 记录所有敏感操作
- 定期备份审计日志
- 监控异常登录行为
- 保留足够长的日志历史

### 5. 环境变量配置

生产环境必须配置以下环境变量：

```bash
# JWT 配置
JWT_SECRET=your-secret-key-at-least-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# 安全配置
NODE_ENV=production
COOKIE_SECURE=true
CORS_ORIGIN=https://your-domain.com
```

---

## 总结

本 RBAC 权限管理系统提供了完整的用户认证、角色管理和权限控制功能，具有以下特点：

### 核心优势

1. **安全可靠**: JWT + Refresh Token 双令牌机制，密码加密，账户锁定
2. **灵活扩展**: 基于资源-操作的权限模型，易于添加新权限
3. **易于管理**: 可视化的用户、角色、权限管理界面
4. **完整审计**: 记录所有重要操作，便于追踪和审计
5. **前后端一致**: 前后端都进行权限验证，双重保障

### 技术实现

- **后端**: Node.js + Express + TypeScript + Prisma ORM
- **数据库**: PostgreSQL 16
- **认证**: JWT + bcrypt
- **前端**: React 19 + TanStack Router + CASL
- **状态管理**: Zustand

### 相关文档

- [数据库设计文档](database_design/)
- [RBAC 规划文档](rbac_plan2.md)
- [API 文档](opencode_api.json)
- [项目说明](../CLAUDE.md)

### 相关代码文件

**后端**:
- [Prisma Schema](../prisma/schema.prisma)
- [认证服务](../server/services/auth/)
- [RBAC 服务](../server/services/rbac/)
- [权限中间件](../server/middleware/permission.middleware.ts)

**前端**:
- [权限配置](../src/config/permissions.ts)
- [认证状态管理](../src/stores/auth-store.ts)
- [权限守卫组件](../src/components/permission-guard.tsx)
- [用户管理](../src/features/users/)
- [角色管理](../src/features/roles/)
- [权限管理](../src/features/permissions/)

---

**文档版本**: 1.0
**最后更新**: 2026-01-29
**维护者**: 开发团队
