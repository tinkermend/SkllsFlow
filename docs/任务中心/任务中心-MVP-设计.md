# 任务中心 MVP 设计

## 1. 背景与目标

任务中心用于把现有的智能对话、技能库和智能服务能力串成可持续执行的 AI 自动化任务。第一版目标不是做完整工作流平台，而是先跑通一个可用闭环：

1. 用户基于已存在的智能服务和已装载的 Skill 创建任务。
2. 用户可以测试运行任务，确认 prompt 和执行环境可用。
3. 用户保存任务后，可以手动执行，也可以按简单周期自动执行。
4. 每次执行都生成运行记录，便于查看结果和排查错误。

## 2. MVP 范围

### 2.1 本期包含

- 仅支持 Skills 任务。
- 复用现有智能服务 Chat Server，不为任务自动创建专属服务。
- 支持任务创建、编辑、删除、暂停、恢复。
- 支持测试运行、手动执行、简单定时执行。
- 支持定时类型：手动、每天、每周、每月。
- 支持运行记录查询和详情查看。
- 支持任务运行前校验智能服务、Skill 装载状态和用户权限。

### 2.2 本期不包含

- 不支持 MCP 任务。
- 不支持复杂条件判断或 AI 裁判步骤。
- 不支持邮件、微信、站内信等通知动作。
- 不支持 cron 表达式和自定义间隔。
- 不支持多步骤任务链和流程图编排。
- 不支持任务专属 Chat Server 生命周期管理。
- 不支持分布式调度和多实例抢占锁。

## 3. 用户流程

### 3.1 创建任务

1. 用户进入任务中心。
2. 点击“新建任务”。
3. 填写任务名称和任务描述。
4. 选择一个当前用户拥有的 active 智能服务。
5. 系统列出已装载到该智能服务的 Skills。
6. 用户选择一个 Skill。
7. 用户填写任务执行提示词。
8. 用户选择执行方式：手动、每天、每周、每月。
9. 用户可以点击“测试运行”。
10. 测试运行成功或失败后，用户可以保存任务。

### 3.2 执行任务

1. 用户在任务列表点击“执行一次”。
2. 后端创建一条 `task_runs` 记录，状态为 `pending`。
3. 后端校验任务定义、智能服务状态和 Skill 装载状态。
4. 校验通过后，运行记录状态改为 `running`。
5. 后端通过绑定的智能服务创建或复用一次 OpenCode 会话，并发送任务 prompt。
6. AI 执行完成后，运行记录状态改为 `success`，保存输出内容。
7. 如果执行失败，运行记录状态改为 `failed`，保存错误信息。

### 3.3 定时执行

1. 后端调度器按固定间隔扫描 active 任务。
2. 找到到期任务后触发一次运行。
3. 每次调度运行都写入 `task_runs`，`trigger_type = schedule`。
4. 调度成功后更新任务的 `last_run_at` 和 `next_run_at`。

## 4. 页面设计

### 4.1 菜单位置

新增菜单：`任务中心`。

建议放在 `智能对话` 与 `技能管理` 之间。理由是任务中心是智能对话能力的自动化延伸，同时会消费技能库能力。

### 4.2 任务列表页

页面结构：

- 顶部统计卡片：总任务数、运行中、今日成功、今日失败。
- 顶部操作区：新建任务、按名称搜索、按状态筛选。
- 任务表格：展示任务定义和最近一次运行状态。

表格字段：

- 任务名称和描述。
- 绑定智能服务。
- 绑定 Skill。
- 调度方式。
- 任务状态：active、paused、disabled。
- 最近运行状态：pending、running、success、failed、cancelled。
- 最近运行时间。
- 操作：执行一次、测试运行、编辑、暂停/恢复、运行记录、删除。

### 4.3 新建/编辑任务页

第一版建议使用独立页面或右侧 Sheet，不建议用小 Dialog。原因是任务字段会继续扩展，Dialog 容易拥挤。

字段分组：

- 基础信息：任务名称、任务描述。
- 执行环境：智能服务、Skill。
- 执行内容：任务 prompt。
- 调度设置：执行方式、执行时间、周几、每月几号。
- 运行设置：超时时间，第一版默认 5 分钟，可允许用户调整。

交互规则：

- 选择智能服务后才加载 Skill 列表。
- Skill 列表只展示已装载到该智能服务的技能。
- 如果智能服务不是 active，禁止保存并提示用户。
- 测试运行不要求保存任务，但会生成一条测试运行记录。

### 4.4 运行记录详情

运行记录可以用抽屉展示，也可以进入详情页。第一版建议使用抽屉，减少页面层级。

详情内容：

- 基本信息：任务名、触发方式、状态、开始时间、结束时间、耗时。
- 输入：本次执行 prompt、绑定服务、绑定 Skill。
- 输出：AI 返回内容。
- 错误：失败时展示错误信息和失败阶段。

## 5. 数据模型

### 5.1 `tasks`

任务定义表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BigInt | 主键 |
| `task_uuid` | UUID | 对外暴露 ID |
| `name` | String | 任务名称 |
| `description` | String? | 任务描述 |
| `chat_server_id` | BigInt | 绑定 `chat_servers.id` |
| `skill_id` | BigInt | 绑定 `skills.id` |
| `prompt` | Text | 任务执行提示词 |
| `schedule_type` | Enum | `manual`、`daily`、`weekly`、`monthly` |
| `schedule_config` | Json? | 调度配置 |
| `timeout_seconds` | Int | 执行超时时间，默认 300 |
| `status` | Enum | `active`、`paused`、`disabled` |
| `last_run_at` | DateTime? | 最近运行时间 |
| `next_run_at` | DateTime? | 下次计划运行时间 |
| `created_by` | BigInt | 创建人 |
| `created_at` | DateTime | 创建时间 |
| `updated_at` | DateTime | 更新时间 |

建议索引：

- `created_by`
- `status`
- `next_run_at`
- `created_by, status`

### 5.2 `task_runs`

任务运行记录表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BigInt | 主键 |
| `run_uuid` | UUID | 对外暴露 ID |
| `task_id` | BigInt | 关联 `tasks.id` |
| `status` | Enum | `pending`、`running`、`success`、`failed`、`cancelled` |
| `trigger_type` | Enum | `manual`、`test`、`schedule` |
| `input` | Json | 执行输入快照 |
| `output` | Text? | 执行输出 |
| `error_message` | Text? | 错误信息 |
| `started_at` | DateTime? | 开始时间 |
| `finished_at` | DateTime? | 结束时间 |
| `created_at` | DateTime | 创建时间 |

建议索引：

- `task_id`
- `status`
- `created_at`
- `task_id, created_at`

## 6. 后端设计

### 6.1 分层

新增模块：

- `server/routes/tasks.routes.ts`
- `server/controllers/tasks.controller.ts`
- `server/services/tasks.service.ts`
- `server/services/task-runner.service.ts`
- `server/services/task-scheduler.service.ts`
- `server/repositories/tasks.repository.ts`
- `server/repositories/task-runs.repository.ts`
- `server/types/task.types.ts`

职责划分：

- `TasksService`：任务 CRUD、状态变更、权限校验。
- `TaskRunnerService`：执行一次任务、写运行记录、处理失败。
- `TaskSchedulerService`：扫描到期任务并触发执行。
- Repository：只负责 Prisma 数据访问。

### 6.2 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/tasks` | 查询当前用户任务列表 |
| `POST` | `/api/tasks` | 创建任务 |
| `GET` | `/api/tasks/:taskUuid` | 查询任务详情 |
| `PATCH` | `/api/tasks/:taskUuid` | 更新任务 |
| `DELETE` | `/api/tasks/:taskUuid` | 删除任务 |
| `POST` | `/api/tasks/:taskUuid/run` | 手动执行一次 |
| `POST` | `/api/tasks/test-run` | 测试运行未保存任务 |
| `POST` | `/api/tasks/:taskUuid/pause` | 暂停任务 |
| `POST` | `/api/tasks/:taskUuid/resume` | 恢复任务 |
| `GET` | `/api/tasks/:taskUuid/runs` | 查询运行记录 |
| `GET` | `/api/task-runs/:runUuid` | 查询运行详情 |

### 6.3 执行校验

每次执行前必须校验：

- 任务存在。
- 当前用户拥有该任务。
- 绑定的 Chat Server 存在且属于当前用户。
- Chat Server 状态为 active。
- 绑定的 Skill 存在。
- `user_skills` 中存在当前用户、当前 Skill、当前 Chat Server 的装载记录。
- prompt 非空。

### 6.4 执行方式

第一版执行策略：

1. 使用绑定 Chat Server 的 OpenCode 连接信息。
2. 为任务运行创建一次 OpenCode Session，或复用任务专用的最近 Session。第一版推荐每次运行创建新 Session，隔离运行上下文，便于日志追踪。
3. 向该 Session 发送 prompt。
4. 等待执行完成，保存输出。

如果当前已有智能对话的同步等待接口不足以直接拿到完成输出，可以第一版采用轮询消息接口或监听事件流的服务端实现。无论采用哪种方式，`TaskRunnerService` 对外只暴露 `runTask()`，避免执行细节泄漏到 Controller。

### 6.5 调度器

第一版使用 Node.js 进程内轻量调度器。

规则：

- 服务启动后初始化调度器。
- 每 60 秒扫描一次 `next_run_at <= now()` 且 `status = active` 的任务。
- 单进程内执行时避免同一任务重复触发。
- 任务触发后立即计算下一次 `next_run_at`。

限制：

- 第一版不支持多后端实例并发调度。
- 如果未来部署多实例，需要增加数据库锁、租约字段或独立队列。

## 7. 前端设计

### 7.1 路由

新增路由：

- `src/routes/_authenticated/tasks/index.tsx`
- 可选：`src/routes/_authenticated/tasks/$taskId.tsx`

第一版可以只做列表页加 Sheet/Drawer。

### 7.2 Feature 目录

新增：

- `src/features/tasks/index.tsx`
- `src/features/tasks/api/tasks.api.ts`
- `src/features/tasks/hooks/use-tasks.ts`
- `src/features/tasks/hooks/use-task-runs.ts`
- `src/features/tasks/components/task-form-sheet.tsx`
- `src/features/tasks/components/task-table.tsx`
- `src/features/tasks/components/task-run-drawer.tsx`
- `src/features/tasks/types/index.ts`

### 7.3 前端状态

任务数据使用 TanStack Query，不新增 Zustand store。

原因：

- 任务列表、详情、运行记录都是服务端状态。
- TanStack Query 已用于现有 API 数据获取。
- 暂停、恢复、执行、删除都可以通过 mutation 后 invalidate 对应 query。

## 8. 状态流转

### 8.1 任务状态

- `active`：可调度、可手动执行。
- `paused`：不可调度，但允许手动测试运行。
- `disabled`：系统禁用状态，第一版主要预留。

### 8.2 运行状态

- `pending`：记录已创建，等待执行。
- `running`：正在执行。
- `success`：执行成功并保存输出。
- `failed`：执行失败并保存错误。
- `cancelled`：执行被取消，第一版预留。

## 9. 错误处理

常见错误需要给出可操作提示：

- 未选择智能服务：请选择一个智能服务。
- 智能服务不可用：当前智能服务不可用，请先检查服务状态。
- Skill 未装载：该 Skill 尚未装载到所选智能服务。
- prompt 为空：请填写任务执行提示词。
- 执行超时：任务执行超过超时时间，请调整任务描述或稍后重试。
- OpenCode 调用失败：展示后端返回的具体错误内容。

后端错误通过统一错误处理中间件返回。前端在表单字段上展示校验错误，在任务执行类错误中展示 toast，并在运行记录中保留失败原因。

## 10. 测试策略

### 10.1 后端

- `TasksService` 创建、编辑、删除、暂停、恢复单元测试。
- `TaskRunnerService` 执行前校验测试。
- `TaskRunnerService` 成功、失败、超时运行记录测试。
- API 集成测试覆盖任务 CRUD 和手动执行入口。

### 10.2 前端

- 任务表单校验测试。
- 智能服务选择后加载 Skill 列表测试。
- 执行、暂停、恢复 mutation 测试。
- 运行记录抽屉渲染测试。

### 10.3 验证命令

根据改动范围选择：

- `pnpm lint`
- `pnpm exec vitest run --config vitest.config.ts src/features/tasks server/__tests__`
- Prisma 变更后执行 `prisma format && prisma validate`

## 11. 分阶段交付

### 阶段 1：数据模型和后端 CRUD

- 新增 Prisma model。
- 新增 Repository、Service、Controller、Routes。
- 完成任务 CRUD、暂停、恢复。

### 阶段 2：前端任务列表和表单

- 新增菜单和路由。
- 完成任务列表、创建、编辑、删除。
- 完成智能服务和 Skill 选择联动。

### 阶段 3：测试运行和手动执行

- 完成 `TaskRunnerService`。
- 完成测试运行和手动执行 API。
- 完成运行记录列表和详情。

### 阶段 4：简单定时调度

- 完成 `TaskSchedulerService`。
- 支持每天、每周、每月。
- 展示最近运行和下次运行时间。

## 12. 风险与约束

- OpenCode 执行结果获取方式需要基于当前 API 能力进一步确认，可能需要轮询或服务端事件监听。
- 进程内调度器只适合单实例部署，多实例部署需要后续升级为数据库锁或队列。
- 任务绑定现有 Chat Server，用户删除 Chat Server 时需要处理关联任务。第一版建议删除 Chat Server 前提示关联任务数量，并要求先停用或删除任务。
- Skill 被删除或卸载后，关联任务应在执行时失败并展示明确原因。后续可以在卸载前增加关联任务检查。

