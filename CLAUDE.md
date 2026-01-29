# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于 Shadcn UI 的管理后台项目，集成了 AI 对话功能（通过 OpenCode API）。项目使用 React 19 + Vite 构建，采用 TanStack Router 进行路由管理。

## 技术栈

| 层级         | 技术                   | 说明                         |
| ------------ | ---------------------- | ---------------------------- |
| **前端框架** | React 19 + Vite        | 现有项目基础                 |
| **UI 组件**  | shadcn/ui              | 基于 Radix UI + Tailwind CSS |
| **状态管理** | Zustand                | 轻量级状态管理               |
| **数据请求** | TanStack Query + Axios | 异步数据管理                 |
| **路由**     | TanStack Router        | 文件系统路由                 |
| **样式**     | Tailwind CSS v4        | 支持 RTL                     |
| **后端**     | Node.js + Express      | OpenCode API 代理服务        |
| **数据库**   | PostgreSQL 16 + Prisma | ORM + 会话存储               |
| **类型检查** | TypeScript 5.9.3       | 严格模式                     |

## 开发命令

### 前端开发

```bash
# 启动前端开发服务器 (端口 5173)
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

### 后端开发

```bash
# 启动后端服务器 (端口 3001)
pnpm dev:server

# 同时启动前后端
pnpm dev:all
```

### 代码质量

```bash
# 运行 ESLint 检查
pnpm lint

# 格式化代码
pnpm format

# 检查格式
pnpm format:check

# 检查未使用的依赖和导出
pnpm knip
```

## 项目架构

### 目录结构

```
src/
├── components/          # 共享组件
│   ├── ui/             # shadcn/ui 组件（部分已自定义）
│   ├── layout/         # 布局组件（侧边栏、头部等）
│   └── data-table/     # 数据表格组件
├── features/           # 功能模块（按业务划分）
│   ├── ai-chat/        # AI 对话功能
│   ├── auth/           # 认证相关
│   ├── dashboard/      # 仪表盘
│   ├── tasks/          # 任务管理
│   ├── users/          # 用户管理
│   └── settings/       # 设置页面
├── routes/             # TanStack Router 路由
│   ├── __root.tsx      # 根路由
│   ├── _authenticated/ # 需要认证的路由
│   └── (auth)/         # 认证相关路由
├── stores/             # Zustand 状态管理
│   ├── auth-store.ts   # 认证状态
│   └── chat-store.ts   # 聊天状态
├── hooks/              # 自定义 Hooks
├── lib/                # 工具函数
└── config/             # 配置文件

server/
├── index.ts            # Express 服务器入口
├── config/             # 配置文件
│   └── env.ts          # 环境变量验证
├── routes/             # API 路由
│   ├── opencode.routes.ts
│   ├── skills.routes.ts
│   └── sessions.routes.ts
├── services/           # 业务逻辑
│   ├── database.service.ts  # 数据库连接管理
│   ├── opencode.service.ts
│   └── sessions.service.ts
├── repositories/       # 数据访问层
│   ├── base.repository.ts   # 通用仓储基类
│   └── sessions.repository.ts
├── controllers/        # 控制器层
│   └── sessions.controller.ts
├── middleware/         # 中间件
│   ├── auth.middleware.ts
│   ├── error-handler.ts
│   ├── prisma-metrics.ts
│   └── retry-middleware.ts
├── utils/              # 工具函数
│   ├── metrics.ts      # Prometheus 指标
│   └── logger.ts       # 结构化日志
└── types/              # 类型定义
    ├── session.types.ts
    └── index.ts
```

### 路由系统

使用 TanStack Router 的文件系统路由：

- `_authenticated/` - 需要认证的路由（使用 AuthenticatedLayout）
- `(auth)/` - 认证相关路由（登录、注册等）
- `(errors)/` - 错误页面
- 路由文件自动生成到 `src/routeTree.gen.ts`

### 状态管理架构

#### Chat Store (`src/stores/chat-store.ts`)

管理 AI 对话的核心状态：

- **OpenCode 连接**: 连接状态、连接对象
- **会话管理**: 会话列表、当前会话
- **消息管理**: 按会话 ID 组织的消息列表
- **流状态**: 流式响应状态、当前流式消息 ID

#### Auth Store (`src/stores/auth-store.ts`)

管理用户认证状态

### AI 对话功能架构

AI 对话功能位于 `src/features/ai-chat/`，核心组件：

1. **连接管理** (`connection-guard.tsx`)

2. **会话管理** (`session-sidebar.tsx`, `session-item.tsx`)

3. **消息展示** (`message-list.tsx`, `message-item.tsx`)

4. **输入面板** (`chat-input.tsx`, `chat-panel.tsx`)

5. **推理展示** (`reasoning-part.tsx`, `tool-reasoning.tsx`)

### 后端服务架构

Express 服务器 (`server/`) 作为 API 的代理：

- **端口**: 3001（可通过 `PORT` 环境变量配置）
- **CORS**: 允许前端 (localhost:5173) 跨域请求
- **健康检查**: `/health`
- **优雅关闭**: 处理 SIGINT/SIGTERM 信号

#### 数据库层 (Prisma + PostgreSQL)

项目使用 **Prisma ORM** 管理数据库操作：

- **ORM**: Prisma 7.3.0
- **Schema**: 定义在 `prisma/schema.prisma`

**Prisma 核心组件**:

- `server/services/database.service.ts` - 数据库连接管理（单例模式）
- `server/repositories/base.repository.ts` - 通用仓储基类（CRUD 操作）
- `server/repositories/sessions.repository.ts` - 会话仓储
- `server/middleware/prisma-metrics.ts` - 查询指标中间件
- `server/middleware/retry-middleware.ts` - 事务重试中间件（150ms 延迟）

**重要原则**:

- 所有数据库操作通过 Repository 模式（不直接使用 Prisma Client）
- 使用 DatabaseService 单例管理连接生命周期

前端通过 Vite 代理 `/api` 请求到后端服务器（见 `vite.config.ts`）

## 重要约定

### 1. 路径别名

使用 `@/` 作为 `src/` 的别名：

```typescript
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chat-store";
```

### 2. Shadcn UI 组件自定义

部分组件已针对 RTL 支持和其他需求进行自定义，更新时需注意：

**已修改的组件**:

- scroll-area, sonner, separator

**RTL 更新的组件**:

- alert-dialog, calendar, command, dialog, dropdown-menu, select, table, sheet, sidebar, switch

使用 shadcn CLI 更新组件时需谨慎，避免覆盖自定义内容。

### 3. 功能模块组织

每个功能模块 (`src/features/*`) 应包含：

- `index.tsx` - 主页面组件
- `components/` - 功能专用组件
- `hooks/` - 功能专用 Hooks
- `types/` - 类型定义（可选）
- `config/` - 配置文件（可选）

### 4. OpenCode API 集成

OpenCode API 文档位于 `docs/openapi.json`，包含：

- 健康检查: `/global/health`
- 全局事件: `/global/event`
- 项目管理: `/project/*`
- 会话管理: `/session/*`

后端服务 (`server/services/opencode.service.ts`) 负责：

- 管理 OpenCode 连接
- 处理流式响应
- 会话生命周期管理

### 5. 数据库操作规范 (Prisma)

所有数据库操作遵循以下原则：

- **Repository 模式**: 通过 Repository 类访问数据库，不在 Controller/Service 中直接使用 Prisma Client
- **单例连接**: 使用 `DatabaseService.getInstance()` 获取 Prisma Client 实例
- **事务支持**: 使用 `repository.transaction()` 处理多表操作
- **错误处理**: Prisma 错误通过 `error-handler.ts` 中间件转换为合适的 HTTP 状态码
- **指标收集**: 所有查询自动记录延迟、错误率和连接池指标
- **重试机制**: 瞬态错误自动重试 1 次（150ms 延迟）

**示例**:

```typescript
// ✅ 正确：使用 Repository
const session = await sessionRepository.findBySessionId(sessionId);

// ❌ 错误：直接使用 Prisma Client
const session = await prisma.session.findUnique({ where: { sessionId } });
```

## 强制规范

- **文档语言**: 所有输出的文档内容使用简体中文
- **代码风格**: 遵循 ESLint 和 Prettier 配置
- **类型安全**: 严格使用 TypeScript，避免 `any` 类型
- **组件命名**: 使用 PascalCase 命名组件文件和组件名
- **Hooks 命名**: 自定义 Hooks 必须以 `use` 开头

## 参考文档

- [OpenCode API 文档](docs/openapi.json)
- [Prisma 文档](https://www.prisma.io/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs/16/)
- [Shadcn UI 文档](https://ui.shadcn.com)
- [TanStack Router 文档](https://tanstack.com/router/latest)
- [TanStack Query 文档](https://tanstack.com/query/latest)
- [Prometheus 指标最佳实践](https://prometheus.io/docs/practices/naming/)

- JSON 文件存储 Mock 数据（`src/mocks/data/`）
