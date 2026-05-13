

## 项目概述

SkllsFlow 是基于 shadcn/ui 的AI智能中枢后台，包含 AI 对话、Skills 管理、MCP 管理、权限与会话等相关能力。

前端使用 React 19 + Vite + TanStack Router，后端使用 Node.js + Express，数据库使用 PostgreSQL 16 + Prisma。

## 技术栈

| 层级   | 技术                                 | 说明                                      |
| ------ | ------------------------------------ | ----------------------------------------- |
| 前端   | React 19, Vite, TypeScript           | 严格类型模式                              |
| UI     | shadcn/ui, Radix UI, Tailwind CSS v4 | 部分组件已做 RTL/项目定制                 |
| 路由   | TanStack Router                      | 文件系统路由，生成 `src/routeTree.gen.ts` |
| 状态   | Zustand                              | 前端状态管理                              |
| 请求   | TanStack Query, Axios                | 异步数据与 API 调用                       |
| 后端   | Express                              | OpenCode API 代理与业务 API               |
| 数据库 | PostgreSQL 16, Prisma                | ORM、迁移、会话与业务数据                 |
| 测试   | Vitest, MSW, Supertest               | 前端、服务端与 API 测试                   |

## 常用命令

```bash
# 前端开发，默认端口 5173
pnpm dev

# 后端开发，默认端口 3001，OpenCode 端口 4096
pnpm dev:server

# 同时启动前后端
pnpm dev:all

# 生产构建
pnpm build

# 代码质量
pnpm lint
pnpm format
pnpm format:check
pnpm knip

# 测试
pnpm test
pnpm test:coverage

# 数据库
pnpm db:migrate
pnpm db:migrate:deploy
pnpm db:comments
pnpm db:migrate:full
```

## 目录与架构

### 前端

- `src/routes/`: TanStack Router 文件路由。
- `src/features/*`: 业务功能模块，通常包含 `index.tsx`、`components/`、`hooks/`、`types/`、`config/`。
- `src/stores/`: Zustand store，例如 `chat-store.ts`、`auth-store.ts`。
- `src/components/ui/`: shadcn/ui 基础组件。
- `src/lib/api-client`: API 客户端统一入口。

### 路由约定

- `_authenticated/`: 需要认证的页面，使用 AuthenticatedLayout。
- `(auth)/`: 登录、注册等认证页面。
- `(errors)/`: 错误页面。
- 修改路由后确认 `src/routeTree.gen.ts` 已正确更新。

### 后端

- `server/index.ts`: Express 服务入口。
- `server/controllers/`: HTTP 控制器。
- `server/services/`: 业务逻辑。
- `server/repositories/`: Prisma 数据访问层。
- `server/middleware/`: 错误处理、指标、重试等中间件。
- `server/utils/bigint-serializer.ts`: BigInt JSON 序列化工具。

### 数据库

- Prisma schema 位于 `prisma/schema.prisma`。
- 业务数据访问优先通过 Repository 层，不要在 Controller 中直接操作 Prisma Client。
- `DatabaseService.getInstance()` 负责统一连接生命周期。
- 所有开发设计的数据库表写一份表sql到 `docs/database_design/` 目录,以表名命名的.sql文件

## 开发约定

### TypeScript 与代码风格

- 遵循现有 ESLint、Prettier 和文件命名风格。
- 尽量避免 `any`；必须使用时给出明确边界或替代计划。
- 组件使用 PascalCase，自定义 Hook 以 `use` 开头。
- 使用 `@/` 作为 `src/` 路径别名。

### API 与服务端

- 前端 API 导入统一使用 `@/lib/api-client`，不要新增容易混淆的 `@/lib/api/*` 子路径。
- 服务端服务类避免在类字段初始化中直接持有 Prisma 实例；优先使用 getter 惰性获取 `DatabaseService.getInstance()`。
- Prisma 错误应通过统一错误处理中间件转换为合适的 HTTP 响应。
- 瞬态数据库错误和指标采集优先复用现有 middleware。

### 数据序列化

PostgreSQL `BIGINT` 在 Prisma 中映射为 JavaScript `BigInt`，不能直接 `JSON.stringify()`。

- Service 层返回 API 数据前使用 `server/utils/bigint-serializer.ts` 统一序列化。
- Repository 层保持原始数据库类型。
- 前端类型中将 `id` 等 BigInt 字段按 API 结果定义为 `string`。

### UI 与布局

- shadcn/ui 组件可能包含项目级定制，更新 CLI 组件前先检查现有差异。
- 已知有定制或 RTL 调整的组件包括：`scroll-area`、`sonner`、`separator`、`alert-dialog`、`calendar`、`command`、`dialog`、`dropdown-menu`、`select`、`table`、`sheet`、`sidebar`、`switch`。
- `_authenticated/` 下的新页面应保持与现有后台一致的 Header/Main 布局和导航体验。

### Skills 与 MCP

- Skills 的 zip 包使用数据库存储。
- MCP 使用对象存储存储。
- 涉及上传、下载或存储路径时，先确认当前实现的数据来源和落库字段，不要只改前端展示。

## 验证要求

根据改动范围选择验证命令，不需要为无关范围强行跑全量。

- 前端或共享代码：`pnpm lint`，必要时 `pnpm test` 或 `pnpm build`。
- 后端 API：`pnpm lint`，必要时 `pnpm test`，并用 curl 或 Supertest 验证关键接口。
- Prisma schema 或迁移：`prisma format && prisma validate`，必要时执行对应迁移命令。
- 依赖、导出或文件结构调整：`pnpm knip`。

提交前不要声称已验证，除非实际运行过对应命令并确认结果。

## 文档与沟通

- 面向项目的文档、注释性说明和总结默认使用简体中文。
- 修改现有约定前先从代码确认真实调用链，避免基于文件名或包名推断。
- 每次功能开发完成写入CHANGELOG.md 记录更改日志
