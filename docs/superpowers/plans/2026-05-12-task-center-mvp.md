# Task Center MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建任务中心 MVP，让用户可以基于现有 active 智能服务和已装载 Skill 创建任务、测试运行、手动运行、简单定时运行，并查看运行记录。

**Architecture:** 采用现有 Express + Prisma + Repository/Service/Controller 分层，新增 `tasks` 与 `task_runs` 两张表。前端新增 `_authenticated/tasks` 路由和 `src/features/tasks` 模块，数据全部通过 TanStack Query 管理，不新增 Zustand store。任务执行统一封装在 `TaskRunnerService.runTask()`，第一版后端内部创建 OpenCode session 并发送 prompt，调度器只负责扫描到期任务并触发执行。

**Tech Stack:** React 19, TanStack Router, TanStack Query, shadcn/ui, Express 5, Prisma 7, PostgreSQL 16, Vitest, Supertest.

---

## File Structure

**数据库**
- Modify: `prisma/schema.prisma` - 新增 `Task`、`TaskRun` model 与 `task_status`、`task_schedule_type`、`task_run_status`、`task_run_trigger_type` enum，并补充 `User`、`ChatServer`、`Skill` 关系字段。
- Create: `prisma/migrations/<timestamp>_add_task_center/migration.sql` - Prisma 生成迁移，包含 enum、表、索引、外键。

**后端类型与数据访问**
- Create: `server/types/task.types.ts` - DTO、请求类型、状态类型、BigInt 序列化转换函数。
- Create: `server/repositories/tasks.repository.ts` - `Task` 查询、创建、更新、删除、到期任务扫描、统计。
- Create: `server/repositories/task-runs.repository.ts` - `TaskRun` 查询、创建、状态更新、详情查询。

**后端业务与 API**
- Create: `server/services/tasks.service.ts` - 任务 CRUD、暂停/恢复、表单校验、权限校验、统计。
- Create: `server/services/task-runner.service.ts` - 测试运行、手动运行、调度运行、执行校验、运行记录状态流转。
- Create: `server/services/task-scheduler.service.ts` - 进程内 60 秒调度器、下一次运行时间计算、单进程去重。
- Create: `server/controllers/tasks.controller.ts` - `/api/tasks` 与 `/api/task-runs` HTTP 控制器。
- Create: `server/routes/tasks.routes.ts` - 任务中心路由并挂载 `jwtAuthMiddleware`。
- Modify: `server/app.ts` - 挂载任务中心路由。
- Modify: `server/index.ts` - 服务启动后启动调度器，关闭时停止调度器。

**后端测试**
- Create: `server/__tests__/unit/services/tasks.service.test.ts`
- Create: `server/__tests__/unit/services/task-runner.service.test.ts`
- Create: `server/__tests__/unit/services/task-scheduler.service.test.ts`
- Create: `server/__tests__/unit/routes/tasks.routes.test.ts`

**前端 API 与类型**
- Modify: `src/config/api.ts` - 增加 `API_ENDPOINTS.tasks`。
- Create: `src/features/tasks/types/index.ts`
- Create: `src/features/tasks/api/tasks.api.ts`
- Create: `src/features/tasks/hooks/use-tasks.ts`
- Create: `src/features/tasks/hooks/use-task-runs.ts`

**前端页面与组件**
- Create: `src/routes/_authenticated/tasks/index.tsx`
- Create: `src/features/tasks/index.tsx`
- Create: `src/features/tasks/components/task-form-sheet.tsx`
- Create: `src/features/tasks/components/task-table.tsx`
- Create: `src/features/tasks/components/task-run-drawer.tsx`
- Modify: `src/components/layout/data/sidebar-data.ts` - 在“智能对话”和“技能管理”之间加入“任务中心”。
- Modify: `src/routeTree.gen.ts` - 路由生成器更新。

**前端测试**
- Create: `src/features/tasks/api/tasks.api.test.ts`
- Create: `src/features/tasks/hooks/use-tasks.test.tsx`

---

## Task 1: 数据模型与迁移

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_task_center/migration.sql`

- [ ] **Step 1: 修改 Prisma schema**

在 `User` model 的关系字段中加入：

```prisma
  tasks               Task[]               @relation("TaskCreator")
```

在 `ChatServer` model 的关系字段中加入：

```prisma
  tasks             Task[]
```

在 `Skill` model 的关系字段中加入：

```prisma
  tasks             Task[]
```

在 `schema.prisma` 中 `UserSkill` 后追加：

```prisma
// ============================================
// 任务定义表
// ============================================
/// 任务定义表，存储可手动或定时执行的 Skill 自动化任务
model Task {
  /// 主键 ID，自增
  id             BigInt             @id @default(autoincrement())
  /// 业务 UUID，用于对外暴露任务标识
  taskUuid       String             @unique @default(uuid()) @map("task_uuid") @db.Uuid
  /// 任务名称
  name           String             @db.VarChar(120)
  /// 任务描述
  description    String?            @db.Text
  /// 绑定聊天服务 ID
  chatServerId   BigInt             @map("chat_server_id")
  /// 绑定技能内部 ID
  skillId        BigInt             @map("skill_id")
  /// 任务执行提示词
  prompt         String             @db.Text
  /// 调度类型
  scheduleType   task_schedule_type @default(manual) @map("schedule_type")
  /// 调度配置
  scheduleConfig Json?              @map("schedule_config")
  /// 执行超时时间，单位秒
  timeoutSeconds Int                @default(300) @map("timeout_seconds")
  /// 任务状态
  status         task_status        @default(active)
  /// 最近运行时间
  lastRunAt      DateTime?          @map("last_run_at")
  /// 下次计划运行时间
  nextRunAt      DateTime?          @map("next_run_at")
  /// 创建人 ID
  createdBy      BigInt             @map("created_by")
  /// 创建时间
  createdAt      DateTime           @default(now()) @map("created_at")
  /// 更新时间
  updatedAt      DateTime           @updatedAt @map("updated_at")

  chatServer ChatServer @relation(fields: [chatServerId], references: [id], onDelete: Restrict)
  skill      Skill      @relation(fields: [skillId], references: [id], onDelete: Restrict)
  creator    User       @relation("TaskCreator", fields: [createdBy], references: [id], onDelete: Restrict)
  runs       TaskRun[]

  @@index([createdBy])
  @@index([status])
  @@index([nextRunAt])
  @@index([createdBy, status])
  @@map("tasks")
  @@schema("aiops")
}

enum task_schedule_type {
  manual
  daily
  weekly
  monthly

  @@schema("aiops")
}

enum task_status {
  active
  paused
  disabled

  @@schema("aiops")
}

// ============================================
// 任务运行记录表
// ============================================
/// 任务运行记录表，存储每次测试、手动或定时执行结果
model TaskRun {
  /// 主键 ID，自增
  id           BigInt                @id @default(autoincrement())
  /// 业务 UUID，用于对外暴露运行标识
  runUuid      String                @unique @default(uuid()) @map("run_uuid") @db.Uuid
  /// 任务 ID
  taskId       BigInt?               @map("task_id")
  /// 运行状态
  status       task_run_status       @default(pending)
  /// 触发方式
  triggerType  task_run_trigger_type @map("trigger_type")
  /// 执行输入快照
  input        Json
  /// 执行输出
  output       String?               @db.Text
  /// 错误信息
  errorMessage String?               @map("error_message") @db.Text
  /// 开始时间
  startedAt    DateTime?             @map("started_at")
  /// 结束时间
  finishedAt   DateTime?             @map("finished_at")
  /// 创建时间
  createdAt    DateTime              @default(now()) @map("created_at")

  task Task? @relation(fields: [taskId], references: [id], onDelete: SetNull)

  @@index([taskId])
  @@index([status])
  @@index([createdAt])
  @@index([taskId, createdAt])
  @@map("task_runs")
  @@schema("aiops")
}

enum task_run_status {
  pending
  running
  success
  failed
  cancelled

  @@schema("aiops")
}

enum task_run_trigger_type {
  manual
  test
  schedule

  @@schema("aiops")
}
```

- [ ] **Step 2: 格式化并验证 schema**

Run:

```bash
pnpm exec prisma format
pnpm exec prisma validate
```

Expected:

```text
Prisma schema loaded from prisma/schema.prisma
The schema at prisma/schema.prisma is valid
```

- [ ] **Step 3: 生成迁移**

Run:

```bash
pnpm exec prisma migrate dev --name add_task_center
```

Expected:

```text
Applying migration `<timestamp>_add_task_center`
The following migration(s) have been created and applied
```

- [ ] **Step 4: 提交数据库模型**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add task center data model"
```

---

## Task 2: 后端类型与 Repository

**Files:**
- Create: `server/types/task.types.ts`
- Create: `server/repositories/tasks.repository.ts`
- Create: `server/repositories/task-runs.repository.ts`
- Test: `server/__tests__/unit/services/tasks.service.test.ts`

- [ ] **Step 1: 写 TasksService 失败测试，锁定 Repository 需要提供的行为**

Create `server/__tests__/unit/services/tasks.service.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TasksService } from '@server/services/tasks.service';

const user = { id: BigInt(7), userUUId: 'user-uuid' };
const chatServer = {
  id: BigInt(11),
  chatId: 'chat-uuid',
  name: '研发智能服务',
  status: 'active',
  createdBy: BigInt(7),
};
const skill = {
  id: BigInt(13),
  skillId: 'code-review',
  name: '代码审查',
  status: 'active',
};

const repositories = {
  users: { findByUserId: vi.fn() },
  tasks: { createTask: vi.fn(), findByTaskUuidForUser: vi.fn(), updateTask: vi.fn() },
  chatServers: { findByChatId: vi.fn() },
  skills: { findBySkillId: vi.fn() },
  taskRuns: {},
  prisma: {
    userSkill: { findFirst: vi.fn() },
  },
};

describe('TasksService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositories.users.findByUserId.mockResolvedValue(user);
    repositories.chatServers.findByChatId.mockResolvedValue(chatServer);
    repositories.skills.findBySkillId.mockResolvedValue(skill);
    repositories.prisma.userSkill.findFirst.mockResolvedValue({
      id: BigInt(31),
      userId: BigInt(7),
      skillId: 'code-review',
      chatId: BigInt(11),
    });
    repositories.tasks.createTask.mockResolvedValue({
      id: BigInt(41),
      taskUuid: 'task-uuid',
      name: '每日代码审查',
      description: null,
      chatServerId: BigInt(11),
      skillId: BigInt(13),
      prompt: '检查今天的代码变更',
      scheduleType: 'manual',
      scheduleConfig: null,
      timeoutSeconds: 300,
      status: 'active',
      lastRunAt: null,
      nextRunAt: null,
      createdBy: BigInt(7),
      createdAt: new Date('2026-05-12T01:00:00Z'),
      updatedAt: new Date('2026-05-12T01:00:00Z'),
      chatServer,
      skill,
      _count: { runs: 0 },
    });
  });

  it('creates a manual task only when chat server and skill binding are valid', async () => {
    const service = new TasksService(repositories as never);

    const result = await service.createTask('user-uuid', {
      name: '每日代码审查',
      description: '',
      chatServerId: 'chat-uuid',
      skillId: 'code-review',
      prompt: '检查今天的代码变更',
      scheduleType: 'manual',
      scheduleConfig: null,
      timeoutSeconds: 300,
    });

    expect(repositories.prisma.userSkill.findFirst).toHaveBeenCalledWith({
      where: {
        userId: BigInt(7),
        skillId: 'code-review',
        chatId: BigInt(11),
      },
    });
    expect(repositories.tasks.createTask).toHaveBeenCalledWith({
      name: '每日代码审查',
      description: null,
      chatServerId: BigInt(11),
      skillId: BigInt(13),
      prompt: '检查今天的代码变更',
      scheduleType: 'manual',
      scheduleConfig: null,
      timeoutSeconds: 300,
      status: 'active',
      nextRunAt: null,
      createdBy: BigInt(7),
    });
    expect(result.id).toBe('41');
    expect(result.taskUuid).toBe('task-uuid');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm exec vitest run --config vitest.config.ts server/__tests__/unit/services/tasks.service.test.ts
```

Expected:

```text
FAIL  server/__tests__/unit/services/tasks.service.test.ts
Cannot find module '@server/services/tasks.service'
```

- [ ] **Step 3: 创建后端类型文件**

Create `server/types/task.types.ts`:

```typescript
import type { ChatServer, Skill, Task, TaskRun } from '@prisma/client';
import { serializeBigInt } from '../utils/bigint-serializer.js';

export type TaskScheduleType = 'manual' | 'daily' | 'weekly' | 'monthly';
export type TaskStatus = 'active' | 'paused' | 'disabled';
export type TaskRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
export type TaskRunTriggerType = 'manual' | 'test' | 'schedule';

export interface TaskScheduleConfig {
  time?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface CreateTaskDto {
  name: string;
  description?: string | null;
  chatServerId: string;
  skillId: string;
  prompt: string;
  scheduleType: TaskScheduleType;
  scheduleConfig?: TaskScheduleConfig | null;
  timeoutSeconds?: number;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {}

export interface TaskInputSnapshot {
  taskUuid?: string;
  chatServerId: string;
  chatServerName: string;
  skillId: string;
  skillName: string;
  prompt: string;
  timeoutSeconds: number;
}

export type TaskWithRelations = Task & {
  chatServer: Pick<ChatServer, 'id' | 'chatId' | 'name' | 'host' | 'port' | 'status'>;
  skill: Pick<Skill, 'id' | 'skillId' | 'name' | 'status'>;
  _count?: { runs: number };
};

export type TaskRunWithTask = TaskRun & {
  task?: (Task & {
    chatServer: Pick<ChatServer, 'id' | 'chatId' | 'name'>;
    skill: Pick<Skill, 'id' | 'skillId' | 'name'>;
  }) | null;
};

export interface TaskResponseDto {
  id: string;
  taskUuid: string;
  name: string;
  description: string | null;
  chatServerId: string;
  chatServerName: string;
  skillId: string;
  skillName: string;
  prompt: string;
  scheduleType: TaskScheduleType;
  scheduleConfig: TaskScheduleConfig | null;
  timeoutSeconds: number;
  status: TaskStatus;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  runsCount?: number;
}

export interface TaskRunResponseDto {
  id: string;
  runUuid: string;
  taskId: string | null;
  taskUuid: string | null;
  taskName: string | null;
  status: TaskRunStatus;
  triggerType: TaskRunTriggerType;
  input: TaskInputSnapshot;
  output: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export function toTaskResponseDto(task: TaskWithRelations): TaskResponseDto {
  const serialized = serializeBigInt(task) as Omit<TaskResponseDto, 'chatServerName' | 'skillName' | 'runsCount'> & {
    chatServer: { name: string };
    skill: { name: string; skillId: string };
    _count?: { runs: number };
  };

  return {
    id: serialized.id,
    taskUuid: serialized.taskUuid,
    name: serialized.name,
    description: serialized.description,
    chatServerId: serialized.chatServerId,
    chatServerName: serialized.chatServer.name,
    skillId: serialized.skill.skillId,
    skillName: serialized.skill.name,
    prompt: serialized.prompt,
    scheduleType: serialized.scheduleType,
    scheduleConfig: serialized.scheduleConfig,
    timeoutSeconds: serialized.timeoutSeconds,
    status: serialized.status,
    lastRunAt: serialized.lastRunAt,
    nextRunAt: serialized.nextRunAt,
    createdBy: serialized.createdBy,
    createdAt: serialized.createdAt,
    updatedAt: serialized.updatedAt,
    runsCount: serialized._count?.runs,
  };
}

export function toTaskRunResponseDto(run: TaskRunWithTask): TaskRunResponseDto {
  const serialized = serializeBigInt(run) as Omit<TaskRunResponseDto, 'taskUuid' | 'taskName'> & {
    task?: { taskUuid: string; name: string } | null;
  };

  return {
    id: serialized.id,
    runUuid: serialized.runUuid,
    taskId: serialized.taskId,
    taskUuid: serialized.task?.taskUuid ?? null,
    taskName: serialized.task?.name ?? null,
    status: serialized.status,
    triggerType: serialized.triggerType,
    input: serialized.input,
    output: serialized.output,
    errorMessage: serialized.errorMessage,
    startedAt: serialized.startedAt,
    finishedAt: serialized.finishedAt,
    createdAt: serialized.createdAt,
  };
}
```

- [ ] **Step 4: 创建 Repository**

Create `server/repositories/tasks.repository.ts`:

```typescript
import { type Prisma, type PrismaClient, type Task } from '@prisma/client';
import { BaseRepository } from './base.repository.js';
import type { TaskWithRelations } from '../types/task.types.js';

const taskInclude = {
  chatServer: { select: { id: true, chatId: true, name: true, host: true, port: true, status: true } },
  skill: { select: { id: true, skillId: true, name: true, status: true } },
  _count: { select: { runs: true } },
} satisfies Prisma.TaskInclude;

export class TasksRepository extends BaseRepository<
  Task,
  Prisma.TaskCreateInput,
  Prisma.TaskUpdateInput,
  Prisma.TaskWhereInput,
  Prisma.TaskOrderByWithRelationInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected get modelName(): string {
    return 'task';
  }

  async createTask(data: Prisma.TaskUncheckedCreateInput): Promise<TaskWithRelations> {
    return this.prisma.task.create({ data, include: taskInclude });
  }

  async findByTaskUuidForUser(taskUuid: string, userId: bigint): Promise<TaskWithRelations | null> {
    return this.prisma.task.findFirst({
      where: { taskUuid, createdBy: userId },
      include: taskInclude,
    });
  }

  async findManyForUser(userId: bigint, filters: { search?: string; status?: string }): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: {
        createdBy: userId,
        status: filters.status ? filters.status as Prisma.Enumtask_statusFilter<'Task'> : undefined,
        OR: filters.search
          ? [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTask(id: bigint, data: Prisma.TaskUncheckedUpdateInput): Promise<TaskWithRelations> {
    return this.prisma.task.update({
      where: { id },
      data,
      include: taskInclude,
    });
  }

  async deleteTask(id: bigint): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }

  async findDueTasks(now: Date, limit = 20): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: {
        status: 'active',
        scheduleType: { not: 'manual' },
        nextRunAt: { lte: now },
      },
      include: taskInclude,
      orderBy: { nextRunAt: 'asc' },
      take: limit,
    });
  }
}
```

Create `server/repositories/task-runs.repository.ts`:

```typescript
import { type Prisma, type PrismaClient, type TaskRun } from '@prisma/client';
import { BaseRepository } from './base.repository.js';
import type { TaskRunWithTask } from '../types/task.types.js';

const taskRunInclude = {
  task: {
    include: {
      chatServer: { select: { id: true, chatId: true, name: true } },
      skill: { select: { id: true, skillId: true, name: true } },
    },
  },
} satisfies Prisma.TaskRunInclude;

export class TaskRunsRepository extends BaseRepository<
  TaskRun,
  Prisma.TaskRunCreateInput,
  Prisma.TaskRunUpdateInput,
  Prisma.TaskRunWhereInput,
  Prisma.TaskRunOrderByWithRelationInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected get modelName(): string {
    return 'taskRun';
  }

  async createRun(data: Prisma.TaskRunUncheckedCreateInput): Promise<TaskRunWithTask> {
    return this.prisma.taskRun.create({ data, include: taskRunInclude });
  }

  async updateRun(id: bigint, data: Prisma.TaskRunUncheckedUpdateInput): Promise<TaskRunWithTask> {
    return this.prisma.taskRun.update({
      where: { id },
      data,
      include: taskRunInclude,
    });
  }

  async findByRunUuid(runUuid: string): Promise<TaskRunWithTask | null> {
    return this.prisma.taskRun.findUnique({
      where: { runUuid },
      include: taskRunInclude,
    });
  }

  async findByTaskId(taskId: bigint): Promise<TaskRunWithTask[]> {
    return this.prisma.taskRun.findMany({
      where: { taskId },
      include: taskRunInclude,
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

- [ ] **Step 5: 运行测试确认进入下一个失败**

Run:

```bash
pnpm exec vitest run --config vitest.config.ts server/__tests__/unit/services/tasks.service.test.ts
```

Expected:

```text
FAIL  server/__tests__/unit/services/tasks.service.test.ts
Cannot find module '@server/services/tasks.service'
```

---

## Task 3: TasksService CRUD、校验与状态流转

**Files:**
- Create: `server/services/tasks.service.ts`
- Modify: `server/__tests__/unit/services/tasks.service.test.ts`

- [ ] **Step 1: 扩展失败测试覆盖无效绑定**

Append to `server/__tests__/unit/services/tasks.service.test.ts`:

```typescript
  it('rejects task creation when skill is not loaded to selected chat server', async () => {
    repositories.prisma.userSkill.findFirst.mockResolvedValue(null);
    const service = new TasksService(repositories as never);

    await expect(service.createTask('user-uuid', {
      name: '每日代码审查',
      chatServerId: 'chat-uuid',
      skillId: 'code-review',
      prompt: '检查今天的代码变更',
      scheduleType: 'manual',
      scheduleConfig: null,
      timeoutSeconds: 300,
    })).rejects.toThrow('该 Skill 尚未装载到所选智能服务');
  });
```

- [ ] **Step 2: 创建 TasksService**

Create `server/services/tasks.service.ts`:

```typescript
import type { PrismaClient } from '@prisma/client';
import { ChatServerRepository } from '../repositories/chat-server.repository.js';
import { SkillsRepository } from '../repositories/skills.repository.js';
import { TasksRepository } from '../repositories/tasks.repository.js';
import { TaskRunsRepository } from '../repositories/task-runs.repository.js';
import { UserRepository } from '../repositories/users.repository.js';
import { DatabaseService } from './database.service.js';
import type { CreateTaskDto, TaskResponseDto, TaskScheduleConfig, UpdateTaskDto } from '../types/task.types.js';
import { toTaskResponseDto } from '../types/task.types.js';

interface TasksServiceDeps {
  prisma: PrismaClient;
  users: UserRepository;
  tasks: TasksRepository;
  taskRuns: TaskRunsRepository;
  chatServers: ChatServerRepository;
  skills: SkillsRepository;
}

export class TasksService {
  private prisma: PrismaClient;
  private users: UserRepository;
  private tasks: TasksRepository;
  private chatServers: ChatServerRepository;
  private skills: SkillsRepository;

  constructor(deps?: TasksServiceDeps) {
    const prisma = deps?.prisma ?? DatabaseService.getInstance();
    this.prisma = prisma;
    this.users = deps?.users ?? new UserRepository(prisma);
    this.tasks = deps?.tasks ?? new TasksRepository(prisma);
    this.chatServers = deps?.chatServers ?? new ChatServerRepository(prisma);
    this.skills = deps?.skills ?? new SkillsRepository(prisma);
  }

  async listTasks(userUuid: string, filters: { search?: string; status?: string }): Promise<TaskResponseDto[]> {
    const user = await this.requireUser(userUuid);
    const tasks = await this.tasks.findManyForUser(user.id, filters);
    return tasks.map(toTaskResponseDto);
  }

  async createTask(userUuid: string, dto: CreateTaskDto): Promise<TaskResponseDto> {
    const user = await this.requireUser(userUuid);
    const validated = await this.validateTaskBinding(user.id, dto);
    const scheduleConfig = this.normalizeSchedule(dto.scheduleType, dto.scheduleConfig ?? null);

    const task = await this.tasks.createTask({
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      chatServerId: validated.chatServer.id,
      skillId: validated.skill.id,
      prompt: dto.prompt.trim(),
      scheduleType: dto.scheduleType,
      scheduleConfig,
      timeoutSeconds: dto.timeoutSeconds ?? 300,
      status: 'active',
      nextRunAt: this.calculateNextRunAt(dto.scheduleType, scheduleConfig, new Date()),
      createdBy: user.id,
    });

    return toTaskResponseDto(task);
  }

  async getTask(userUuid: string, taskUuid: string): Promise<TaskResponseDto> {
    const task = await this.requireTaskForUser(userUuid, taskUuid);
    return toTaskResponseDto(task);
  }

  async updateTask(userUuid: string, taskUuid: string, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    const current = await this.requireTaskForUser(userUuid, taskUuid);
    const nextDto: CreateTaskDto = {
      name: dto.name ?? current.name,
      description: dto.description ?? current.description,
      chatServerId: dto.chatServerId ?? current.chatServer.chatId,
      skillId: dto.skillId ?? current.skill.skillId,
      prompt: dto.prompt ?? current.prompt,
      scheduleType: dto.scheduleType ?? current.scheduleType,
      scheduleConfig: dto.scheduleConfig ?? current.scheduleConfig as TaskScheduleConfig | null,
      timeoutSeconds: dto.timeoutSeconds ?? current.timeoutSeconds,
    };
    const validated = await this.validateTaskBinding(current.createdBy, nextDto);
    const scheduleConfig = this.normalizeSchedule(nextDto.scheduleType, nextDto.scheduleConfig ?? null);

    const updated = await this.tasks.updateTask(current.id, {
      name: nextDto.name.trim(),
      description: nextDto.description?.trim() || null,
      chatServerId: validated.chatServer.id,
      skillId: validated.skill.id,
      prompt: nextDto.prompt.trim(),
      scheduleType: nextDto.scheduleType,
      scheduleConfig,
      timeoutSeconds: nextDto.timeoutSeconds ?? 300,
      nextRunAt: this.calculateNextRunAt(nextDto.scheduleType, scheduleConfig, new Date()),
    });

    return toTaskResponseDto(updated);
  }

  async deleteTask(userUuid: string, taskUuid: string): Promise<void> {
    const task = await this.requireTaskForUser(userUuid, taskUuid);
    await this.tasks.deleteTask(task.id);
  }

  async pauseTask(userUuid: string, taskUuid: string): Promise<TaskResponseDto> {
    const task = await this.requireTaskForUser(userUuid, taskUuid);
    return toTaskResponseDto(await this.tasks.updateTask(task.id, { status: 'paused' }));
  }

  async resumeTask(userUuid: string, taskUuid: string): Promise<TaskResponseDto> {
    const task = await this.requireTaskForUser(userUuid, taskUuid);
    const scheduleConfig = task.scheduleConfig as TaskScheduleConfig | null;
    return toTaskResponseDto(await this.tasks.updateTask(task.id, {
      status: 'active',
      nextRunAt: this.calculateNextRunAt(task.scheduleType, scheduleConfig, new Date()),
    }));
  }

  async requireTaskForUser(userUuid: string, taskUuid: string) {
    const user = await this.requireUser(userUuid);
    const task = await this.tasks.findByTaskUuidForUser(taskUuid, user.id);
    if (!task) {
      throw new Error('任务不存在');
    }
    return task;
  }

  calculateNextRunAt(scheduleType: string, config: TaskScheduleConfig | null, from: Date): Date | null {
    if (scheduleType === 'manual') return null;
    const [hour, minute] = (config?.time ?? '09:00').split(':').map(Number);
    const next = new Date(from);
    next.setSeconds(0, 0);
    next.setHours(hour, minute, 0, 0);
    if (next <= from) next.setDate(next.getDate() + 1);
    if (scheduleType === 'weekly') {
      const dayOfWeek = config?.dayOfWeek ?? 1;
      while (next.getDay() !== dayOfWeek || next <= from) next.setDate(next.getDate() + 1);
    }
    if (scheduleType === 'monthly') {
      const dayOfMonth = Math.min(config?.dayOfMonth ?? 1, 28);
      next.setDate(dayOfMonth);
      if (next <= from) next.setMonth(next.getMonth() + 1, dayOfMonth);
    }
    return next;
  }

  private async requireUser(userUuid: string) {
    const user = await this.users.findByUserId(userUuid);
    if (!user) throw new Error('用户不存在');
    return user;
  }

  private async validateTaskBinding(userId: bigint, dto: CreateTaskDto) {
    if (!dto.name?.trim()) throw new Error('请输入任务名称');
    if (!dto.chatServerId) throw new Error('请选择一个智能服务');
    if (!dto.skillId) throw new Error('请选择一个 Skill');
    if (!dto.prompt?.trim()) throw new Error('请填写任务执行提示词');

    const chatServer = await this.chatServers.findByChatId(dto.chatServerId);
    if (!chatServer || chatServer.createdBy !== userId) throw new Error('智能服务不存在');
    if (chatServer.status !== 'active') throw new Error('当前智能服务不可用，请先检查服务状态');

    const skill = await this.skills.findBySkillId(dto.skillId);
    if (!skill || skill.status !== 'active') throw new Error('Skill 不存在或已禁用');

    const binding = await this.prisma.userSkill.findFirst({
      where: { userId, skillId: skill.skillId, chatId: chatServer.id },
    });
    if (!binding) throw new Error('该 Skill 尚未装载到所选智能服务');

    return { chatServer, skill };
  }

  private normalizeSchedule(scheduleType: string, config: TaskScheduleConfig | null): TaskScheduleConfig | null {
    if (scheduleType === 'manual') return null;
    return { time: config?.time ?? '09:00', dayOfWeek: config?.dayOfWeek, dayOfMonth: config?.dayOfMonth };
  }
}
```

- [ ] **Step 3: 运行服务测试**

Run:

```bash
pnpm exec vitest run --config vitest.config.ts server/__tests__/unit/services/tasks.service.test.ts
```

Expected:

```text
PASS  server/__tests__/unit/services/tasks.service.test.ts
```

- [ ] **Step 4: 提交 Service 与 Repository**

```bash
git add server/types/task.types.ts server/repositories/tasks.repository.ts server/repositories/task-runs.repository.ts server/services/tasks.service.ts server/__tests__/unit/services/tasks.service.test.ts
git commit -m "feat: add task CRUD service"
```

---

## Task 4: TaskRunnerService 执行与运行记录

**Files:**
- Create: `server/services/task-runner.service.ts`
- Create: `server/__tests__/unit/services/task-runner.service.test.ts`

- [ ] **Step 1: 写失败测试**

Create `server/__tests__/unit/services/task-runner.service.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskRunnerService } from '@server/services/task-runner.service';

const task = {
  id: BigInt(41),
  taskUuid: 'task-uuid',
  name: '每日代码审查',
  prompt: '检查今天的代码变更',
  timeoutSeconds: 300,
  createdBy: BigInt(7),
  chatServer: { id: BigInt(11), chatId: 'chat-uuid', name: '研发智能服务', host: '127.0.0.1', port: 4096, status: 'active' },
  skill: { id: BigInt(13), skillId: 'code-review', name: '代码审查', status: 'active' },
};

describe('TaskRunnerService', () => {
  const deps = {
    tasksService: { requireTaskForUser: vi.fn(), calculateNextRunAt: vi.fn() },
    taskRuns: { createRun: vi.fn(), updateRun: vi.fn() },
    tasks: { updateTask: vi.fn() },
    opencodeClient: { createSession: vi.fn(), sendMessageAndWait: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    deps.tasksService.requireTaskForUser.mockResolvedValue(task);
    deps.taskRuns.createRun.mockResolvedValue({ id: BigInt(51), runUuid: 'run-uuid', taskId: BigInt(41), status: 'pending', triggerType: 'manual', input: {}, output: null, errorMessage: null, startedAt: null, finishedAt: null, createdAt: new Date(), task });
    deps.taskRuns.updateRun.mockImplementation(async (_id, data) => ({ id: BigInt(51), runUuid: 'run-uuid', taskId: BigInt(41), status: data.status, triggerType: 'manual', input: {}, output: data.output ?? null, errorMessage: data.errorMessage ?? null, startedAt: data.startedAt ?? null, finishedAt: data.finishedAt ?? null, createdAt: new Date(), task }));
    deps.opencodeClient.createSession.mockResolvedValue({ sessionId: 'opencode-session' });
    deps.opencodeClient.sendMessageAndWait.mockResolvedValue('执行完成');
  });

  it('creates a run, sends prompt to OpenCode, and stores output', async () => {
    const service = new TaskRunnerService(deps as never);

    const result = await service.runSavedTask('user-uuid', 'task-uuid', 'manual');

    expect(deps.taskRuns.createRun).toHaveBeenCalledWith(expect.objectContaining({
      taskId: BigInt(41),
      status: 'pending',
      triggerType: 'manual',
    }));
    expect(deps.opencodeClient.sendMessageAndWait).toHaveBeenCalledWith(expect.objectContaining({
      chatServer: task.chatServer,
      sessionId: 'opencode-session',
      prompt: '检查今天的代码变更',
      timeoutSeconds: 300,
    }));
    expect(result.status).toBe('success');
    expect(result.output).toBe('执行完成');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
pnpm exec vitest run --config vitest.config.ts server/__tests__/unit/services/task-runner.service.test.ts
```

Expected:

```text
FAIL  server/__tests__/unit/services/task-runner.service.test.ts
Cannot find module '@server/services/task-runner.service'
```

- [ ] **Step 3: 实现 TaskRunnerService**

Create `server/services/task-runner.service.ts`:

```typescript
import type { TaskRunTriggerType } from '../types/task.types.js';
import { toTaskRunResponseDto } from '../types/task.types.js';
import { DatabaseService } from './database.service.js';
import { TasksService } from './tasks.service.js';
import { TasksRepository } from '../repositories/tasks.repository.js';
import { TaskRunsRepository } from '../repositories/task-runs.repository.js';

interface OpenCodeRunInput {
  chatServer: { host: string; port: number };
  sessionId: string;
  prompt: string;
  timeoutSeconds: number;
}

export class OpenCodeTaskClient {
  async createSession(chatServer: { host: string; port: number }): Promise<{ sessionId: string }> {
    const response = await fetch(`http://${chatServer.host}:${chatServer.port}/session`, { method: 'POST' });
    if (!response.ok) throw new Error(`OpenCode 创建会话失败：${response.status}`);
    return response.json() as Promise<{ sessionId: string }>;
  }

  async sendMessageAndWait(input: OpenCodeRunInput): Promise<string> {
    const response = await fetch(`http://${input.chatServer.host}:${input.chatServer.port}/session/${input.sessionId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input.prompt }),
      signal: AbortSignal.timeout(input.timeoutSeconds * 1000),
    });
    if (!response.ok) throw new Error(`OpenCode 调用失败：${response.status}`);
    const data = await response.json() as { output?: string; message?: string; content?: string };
    return data.output ?? data.message ?? data.content ?? '';
  }
}

interface TaskRunnerDeps {
  tasksService: TasksService;
  taskRuns: TaskRunsRepository;
  tasks: TasksRepository;
  opencodeClient: OpenCodeTaskClient;
}

export class TaskRunnerService {
  private tasksService: TasksService;
  private taskRuns: TaskRunsRepository;
  private tasks: TasksRepository;
  private opencodeClient: OpenCodeTaskClient;

  constructor(deps?: TaskRunnerDeps) {
    const prisma = DatabaseService.getInstance();
    this.tasksService = deps?.tasksService ?? new TasksService();
    this.taskRuns = deps?.taskRuns ?? new TaskRunsRepository(prisma);
    this.tasks = deps?.tasks ?? new TasksRepository(prisma);
    this.opencodeClient = deps?.opencodeClient ?? new OpenCodeTaskClient();
  }

  async runSavedTask(userUuid: string, taskUuid: string, triggerType: TaskRunTriggerType) {
    const task = await this.tasksService.requireTaskForUser(userUuid, taskUuid);
    return this.runTaskRecord(task, triggerType);
  }

  async runTaskRecord(task: Awaited<ReturnType<TasksService['requireTaskForUser']>>, triggerType: TaskRunTriggerType) {
    const input = {
      taskUuid: task.taskUuid,
      chatServerId: task.chatServer.chatId,
      chatServerName: task.chatServer.name,
      skillId: task.skill.skillId,
      skillName: task.skill.name,
      prompt: task.prompt,
      timeoutSeconds: task.timeoutSeconds,
    };

    const run = await this.taskRuns.createRun({
      taskId: task.id,
      status: 'pending',
      triggerType,
      input,
    });

    try {
      await this.taskRuns.updateRun(run.id, { status: 'running', startedAt: new Date() });
      const session = await this.opencodeClient.createSession(task.chatServer);
      const output = await this.opencodeClient.sendMessageAndWait({
        chatServer: task.chatServer,
        sessionId: session.sessionId,
        prompt: task.prompt,
        timeoutSeconds: task.timeoutSeconds,
      });

      const finished = await this.taskRuns.updateRun(run.id, {
        status: 'success',
        output,
        finishedAt: new Date(),
      });
      await this.tasks.updateTask(task.id, { lastRunAt: new Date() });
      return toTaskRunResponseDto(finished);
    } catch (error) {
      const failed = await this.taskRuns.updateRun(run.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '未知错误',
        finishedAt: new Date(),
      });
      return toTaskRunResponseDto(failed);
    }
  }
}
```

- [ ] **Step 4: 运行测试**

Run:

```bash
pnpm exec vitest run --config vitest.config.ts server/__tests__/unit/services/task-runner.service.test.ts
```

Expected:

```text
PASS  server/__tests__/unit/services/task-runner.service.test.ts
```

- [ ] **Step 5: 提交执行器**

```bash
git add server/services/task-runner.service.ts server/__tests__/unit/services/task-runner.service.test.ts
git commit -m "feat: add task runner"
```

---

## Task 5: 后端 Controller 与 Routes

**Files:**
- Create: `server/controllers/tasks.controller.ts`
- Create: `server/routes/tasks.routes.ts`
- Modify: `server/app.ts`
- Create: `server/__tests__/unit/routes/tasks.routes.test.ts`

- [ ] **Step 1: 写路由注册失败测试**

Create `server/__tests__/unit/routes/tasks.routes.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest';

vi.mock('@server/controllers/tasks.controller', () => ({
  TasksController: class {
    listTasks = vi.fn();
    createTask = vi.fn();
    getTask = vi.fn();
    updateTask = vi.fn();
    deleteTask = vi.fn();
    pauseTask = vi.fn();
    resumeTask = vi.fn();
    runTask = vi.fn();
    testRun = vi.fn();
    listRuns = vi.fn();
    getRun = vi.fn();
  },
}));

vi.mock('@server/middleware/jwt-auth.middleware', () => ({
  jwtAuthMiddleware: 'jwtAuthMiddleware',
}));

const routeCalls: Array<{ method: string; path: string; handlers: unknown[] }> = [];

vi.mock('express', () => ({
  Router: () => ({
    use: vi.fn(),
    get: vi.fn((path: string, ...handlers: unknown[]) => routeCalls.push({ method: 'get', path, handlers })),
    post: vi.fn((path: string, ...handlers: unknown[]) => routeCalls.push({ method: 'post', path, handlers })),
    patch: vi.fn((path: string, ...handlers: unknown[]) => routeCalls.push({ method: 'patch', path, handlers })),
    delete: vi.fn((path: string, ...handlers: unknown[]) => routeCalls.push({ method: 'delete', path, handlers })),
  }),
}));

describe('tasks routes', () => {
  it('registers task center endpoints', async () => {
    routeCalls.length = 0;
    await import('@server/routes/tasks.routes');

    expect(routeCalls).toEqual(expect.arrayContaining([
      expect.objectContaining({ method: 'get', path: '/' }),
      expect.objectContaining({ method: 'post', path: '/' }),
      expect.objectContaining({ method: 'post', path: '/test-run' }),
      expect.objectContaining({ method: 'post', path: '/:taskUuid/run' }),
      expect.objectContaining({ method: 'post', path: '/:taskUuid/pause' }),
      expect.objectContaining({ method: 'post', path: '/:taskUuid/resume' }),
      expect.objectContaining({ method: 'get', path: '/:taskUuid/runs' }),
      expect.objectContaining({ method: 'get', path: '/runs/:runUuid' }),
    ]));
  });
});
```

- [ ] **Step 2: 实现 Controller**

Create `server/controllers/tasks.controller.ts`:

```typescript
import { type Request, type Response } from 'express';
import { TasksService } from '../services/tasks.service.js';
import { TaskRunnerService } from '../services/task-runner.service.js';
import { TaskRunsRepository } from '../repositories/task-runs.repository.js';
import { DatabaseService } from '../services/database.service.js';
import { toTaskRunResponseDto } from '../types/task.types.js';

export class TasksController {
  private tasksService = new TasksService();
  private runner = new TaskRunnerService();
  private taskRuns = new TaskRunsRepository(DatabaseService.getInstance());

  async listTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.requireUser(req, res);
      if (!userId) return;
      const tasks = await this.tasksService.listTasks(userId, {
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
      });
      res.status(200).json(tasks);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.requireUser(req, res);
      if (!userId) return;
      res.status(201).json(await this.tasksService.createTask(userId, req.body));
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.requireUser(req, res);
      if (!userId) return;
      res.status(200).json(await this.tasksService.getTask(userId, req.params.taskUuid));
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.requireUser(req, res);
      if (!userId) return;
      res.status(200).json(await this.tasksService.updateTask(userId, req.params.taskUuid, req.body));
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.requireUser(req, res);
      if (!userId) return;
      await this.tasksService.deleteTask(userId, req.params.taskUuid);
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async pauseTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.requireUser(req, res);
      if (!userId) return;
      res.status(200).json(await this.tasksService.pauseTask(userId, req.params.taskUuid));
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async resumeTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.requireUser(req, res);
      if (!userId) return;
      res.status(200).json(await this.tasksService.resumeTask(userId, req.params.taskUuid));
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async runTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.requireUser(req, res);
      if (!userId) return;
      res.status(202).json(await this.runner.runSavedTask(userId, req.params.taskUuid, 'manual'));
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async testRun(req: Request, res: Response): Promise<void> {
    res.status(501).json({ error: 'Not implemented', message: '测试运行将在执行器接入未保存任务输入后启用' });
  }

  async listRuns(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.requireUser(req, res);
      if (!userId) return;
      const task = await this.tasksService.requireTaskForUser(userId, req.params.taskUuid);
      const runs = await this.taskRuns.findByTaskId(task.id);
      res.status(200).json(runs.map(toTaskRunResponseDto));
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getRun(req: Request, res: Response): Promise<void> {
    try {
      const run = await this.taskRuns.findByRunUuid(req.params.runUuid);
      if (!run) {
        res.status(404).json({ error: 'Not Found', message: '运行记录不存在' });
        return;
      }
      res.status(200).json(toTaskRunResponseDto(run));
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private requireUser(req: Request, res: Response): string | null {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication token is missing or invalid' });
      return null;
    }
    return req.userId;
  }

  private handleError(res: Response, error: unknown): void {
    const message = error instanceof Error ? error.message : '未知错误';
    if (message.includes('不存在')) {
      res.status(404).json({ error: 'Not Found', message });
      return;
    }
    if (message.includes('无权')) {
      res.status(403).json({ error: 'Forbidden', message });
      return;
    }
    if (message.includes('请选择') || message.includes('请填写') || message.includes('尚未装载') || message.includes('不可用')) {
      res.status(400).json({ error: 'Bad Request', message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error', message });
  }
}
```

- [ ] **Step 3: 实现 Routes**

Create `server/routes/tasks.routes.ts`:

```typescript
import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { TasksController } from '../controllers/tasks.controller.js';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';

const router: RouterType = Router();

router.use((req: Request, _res: Response, next: NextFunction) => {
  req.tasksController = new TasksController();
  next();
});

router.get('/runs/:runUuid', jwtAuthMiddleware, (req: Request, res: Response) => req.tasksController.getRun(req, res));
router.post('/test-run', jwtAuthMiddleware, (req: Request, res: Response) => req.tasksController.testRun(req, res));
router.get('/', jwtAuthMiddleware, (req: Request, res: Response) => req.tasksController.listTasks(req, res));
router.post('/', jwtAuthMiddleware, (req: Request, res: Response) => req.tasksController.createTask(req, res));
router.get('/:taskUuid', jwtAuthMiddleware, (req: Request, res: Response) => req.tasksController.getTask(req, res));
router.patch('/:taskUuid', jwtAuthMiddleware, (req: Request, res: Response) => req.tasksController.updateTask(req, res));
router.delete('/:taskUuid', jwtAuthMiddleware, (req: Request, res: Response) => req.tasksController.deleteTask(req, res));
router.post('/:taskUuid/run', jwtAuthMiddleware, (req: Request, res: Response) => req.tasksController.runTask(req, res));
router.post('/:taskUuid/pause', jwtAuthMiddleware, (req: Request, res: Response) => req.tasksController.pauseTask(req, res));
router.post('/:taskUuid/resume', jwtAuthMiddleware, (req: Request, res: Response) => req.tasksController.resumeTask(req, res));
router.get('/:taskUuid/runs', jwtAuthMiddleware, (req: Request, res: Response) => req.tasksController.listRuns(req, res));

export default router;

declare global {
  namespace Express {
    interface Request {
      tasksController: TasksController;
    }
  }
}
```

- [ ] **Step 4: 挂载 API**

Modify `server/app.ts`:

```typescript
import tasksRoutes from './routes/tasks.routes.js'
```

在 `app.use('/api/chat-servers', chatServerRoutes)` 后加入：

```typescript
app.use('/api/tasks', tasksRoutes)
```

- [ ] **Step 5: 运行路由测试**

Run:

```bash
pnpm exec vitest run --config vitest.config.ts server/__tests__/unit/routes/tasks.routes.test.ts
```

Expected:

```text
PASS  server/__tests__/unit/routes/tasks.routes.test.ts
```

- [ ] **Step 6: 提交 API 层**

```bash
git add server/controllers/tasks.controller.ts server/routes/tasks.routes.ts server/app.ts server/__tests__/unit/routes/tasks.routes.test.ts
git commit -m "feat: expose task center APIs"
```

---

## Task 6: 简单调度器

**Files:**
- Create: `server/services/task-scheduler.service.ts`
- Modify: `server/index.ts`
- Create: `server/__tests__/unit/services/task-scheduler.service.test.ts`

- [ ] **Step 1: 写调度器失败测试**

Create `server/__tests__/unit/services/task-scheduler.service.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskSchedulerService } from '@server/services/task-scheduler.service';

describe('TaskSchedulerService', () => {
  const task = { id: BigInt(1), taskUuid: 'task-uuid', scheduleType: 'daily', scheduleConfig: { time: '09:00' } };
  const deps = {
    tasks: { findDueTasks: vi.fn(), updateTask: vi.fn() },
    runner: { runTaskRecord: vi.fn() },
    tasksService: { calculateNextRunAt: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    deps.tasks.findDueTasks.mockResolvedValue([task]);
    deps.tasksService.calculateNextRunAt.mockReturnValue(new Date('2026-05-13T01:00:00Z'));
    deps.runner.runTaskRecord.mockResolvedValue({ runUuid: 'run-uuid', status: 'success' });
  });

  it('runs due tasks and updates nextRunAt', async () => {
    const scheduler = new TaskSchedulerService(deps as never);

    await scheduler.tick(new Date('2026-05-12T01:00:00Z'));

    expect(deps.runner.runTaskRecord).toHaveBeenCalledWith(task, 'schedule');
    expect(deps.tasks.updateTask).toHaveBeenCalledWith(BigInt(1), {
      nextRunAt: new Date('2026-05-13T01:00:00Z'),
    });
  });
});
```

- [ ] **Step 2: 实现调度器**

Create `server/services/task-scheduler.service.ts`:

```typescript
import { TasksRepository } from '../repositories/tasks.repository.js';
import { DatabaseService } from './database.service.js';
import { TaskRunnerService } from './task-runner.service.js';
import { TasksService } from './tasks.service.js';

interface SchedulerDeps {
  tasks: TasksRepository;
  runner: TaskRunnerService;
  tasksService: TasksService;
}

export class TaskSchedulerService {
  private timer: NodeJS.Timeout | null = null;
  private runningTaskIds = new Set<string>();
  private tasks: TasksRepository;
  private runner: TaskRunnerService;
  private tasksService: TasksService;

  constructor(deps?: SchedulerDeps) {
    const prisma = DatabaseService.getInstance();
    this.tasks = deps?.tasks ?? new TasksRepository(prisma);
    this.runner = deps?.runner ?? new TaskRunnerService();
    this.tasksService = deps?.tasksService ?? new TasksService();
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick(new Date());
    }, 60_000);
    void this.tick(new Date());
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick(now: Date): Promise<void> {
    const dueTasks = await this.tasks.findDueTasks(now);
    for (const task of dueTasks) {
      const key = task.id.toString();
      if (this.runningTaskIds.has(key)) continue;
      this.runningTaskIds.add(key);
      try {
        const nextRunAt = this.tasksService.calculateNextRunAt(task.scheduleType, task.scheduleConfig as never, now);
        await this.tasks.updateTask(task.id, { nextRunAt });
        await this.runner.runTaskRecord(task, 'schedule');
      } finally {
        this.runningTaskIds.delete(key);
      }
    }
  }
}

export const taskSchedulerService = new TaskSchedulerService();
```

- [ ] **Step 3: 启停调度器**

Modify `server/index.ts`:

```typescript
import { taskSchedulerService } from './services/task-scheduler.service.js'
```

在 `app.listen` 回调后加入：

```typescript
    taskSchedulerService.start()
```

在 `shutdown` 中 `await openCodeService.cleanupAll()` 前加入：

```typescript
      taskSchedulerService.stop()
```

- [ ] **Step 4: 运行调度器测试**

Run:

```bash
pnpm exec vitest run --config vitest.config.ts server/__tests__/unit/services/task-scheduler.service.test.ts
```

Expected:

```text
PASS  server/__tests__/unit/services/task-scheduler.service.test.ts
```

- [ ] **Step 5: 提交调度器**

```bash
git add server/services/task-scheduler.service.ts server/index.ts server/__tests__/unit/services/task-scheduler.service.test.ts
git commit -m "feat: add task scheduler"
```

---

## Task 7: 前端 API、Hooks 与类型

**Files:**
- Modify: `src/config/api.ts`
- Create: `src/features/tasks/types/index.ts`
- Create: `src/features/tasks/api/tasks.api.ts`
- Create: `src/features/tasks/hooks/use-tasks.ts`
- Create: `src/features/tasks/hooks/use-task-runs.ts`
- Create: `src/features/tasks/api/tasks.api.test.ts`

- [ ] **Step 1: 写 API 失败测试**

Create `src/features/tasks/api/tasks.api.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest';
import { tasksApi } from './tasks.api';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('tasksApi', () => {
  it('creates a task through unified apiClient', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { taskUuid: 'task-uuid' } });

    const result = await tasksApi.createTask({
      name: '每日代码审查',
      description: '',
      chatServerId: 'chat-uuid',
      skillId: 'code-review',
      prompt: '检查今天的代码变更',
      scheduleType: 'manual',
      scheduleConfig: null,
      timeoutSeconds: 300,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/tasks', expect.objectContaining({
      name: '每日代码审查',
      chatServerId: 'chat-uuid',
      skillId: 'code-review',
    }));
    expect(result.taskUuid).toBe('task-uuid');
  });
});
```

- [ ] **Step 2: 实现类型**

Create `src/features/tasks/types/index.ts`:

```typescript
export type TaskScheduleType = 'manual' | 'daily' | 'weekly' | 'monthly'
export type TaskStatus = 'active' | 'paused' | 'disabled'
export type TaskRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
export type TaskRunTriggerType = 'manual' | 'test' | 'schedule'

export interface TaskScheduleConfig {
  time?: string
  dayOfWeek?: number
  dayOfMonth?: number
}

export interface Task {
  id: string
  taskUuid: string
  name: string
  description: string | null
  chatServerId: string
  chatServerName: string
  skillId: string
  skillName: string
  prompt: string
  scheduleType: TaskScheduleType
  scheduleConfig: TaskScheduleConfig | null
  timeoutSeconds: number
  status: TaskStatus
  lastRunAt: string | null
  nextRunAt: string | null
  createdAt: string
  updatedAt: string
}

export type TaskFormValues = Pick<
  Task,
  'name' | 'description' | 'chatServerId' | 'skillId' | 'prompt' | 'scheduleType' | 'scheduleConfig' | 'timeoutSeconds'
>

export interface TaskRun {
  id: string
  runUuid: string
  taskId: string | null
  taskUuid: string | null
  taskName: string | null
  status: TaskRunStatus
  triggerType: TaskRunTriggerType
  input: {
    chatServerId: string
    chatServerName: string
    skillId: string
    skillName: string
    prompt: string
    timeoutSeconds: number
  }
  output: string | null
  errorMessage: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
}
```

- [ ] **Step 3: 配置 API endpoint**

Modify `src/config/api.ts` inside `API_ENDPOINTS`:

```typescript
  tasks: {
    list: "/tasks",
    create: "/tasks",
    testRun: "/tasks/test-run",
    detail: (taskUuid: string) => `/tasks/${taskUuid}`,
    update: (taskUuid: string) => `/tasks/${taskUuid}`,
    delete: (taskUuid: string) => `/tasks/${taskUuid}`,
    run: (taskUuid: string) => `/tasks/${taskUuid}/run`,
    pause: (taskUuid: string) => `/tasks/${taskUuid}/pause`,
    resume: (taskUuid: string) => `/tasks/${taskUuid}/resume`,
    runs: (taskUuid: string) => `/tasks/${taskUuid}/runs`,
    runDetail: (runUuid: string) => `/tasks/runs/${runUuid}`,
  },
```

- [ ] **Step 4: 实现 API 与 hooks**

Create `src/features/tasks/api/tasks.api.ts`:

```typescript
import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import type { Task, TaskFormValues, TaskRun } from '../types'

export const tasksApi = {
  async getTasks(params?: { search?: string; status?: string }): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(API_ENDPOINTS.tasks.list, { params })
    return response.data
  },
  async createTask(data: TaskFormValues): Promise<Task> {
    const response = await apiClient.post<Task>(API_ENDPOINTS.tasks.create, data)
    return response.data
  },
  async updateTask(taskUuid: string, data: Partial<TaskFormValues>): Promise<Task> {
    const response = await apiClient.patch<Task>(API_ENDPOINTS.tasks.update(taskUuid), data)
    return response.data
  },
  async deleteTask(taskUuid: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.tasks.delete(taskUuid))
  },
  async runTask(taskUuid: string): Promise<TaskRun> {
    const response = await apiClient.post<TaskRun>(API_ENDPOINTS.tasks.run(taskUuid))
    return response.data
  },
  async pauseTask(taskUuid: string): Promise<Task> {
    const response = await apiClient.post<Task>(API_ENDPOINTS.tasks.pause(taskUuid))
    return response.data
  },
  async resumeTask(taskUuid: string): Promise<Task> {
    const response = await apiClient.post<Task>(API_ENDPOINTS.tasks.resume(taskUuid))
    return response.data
  },
  async getTaskRuns(taskUuid: string): Promise<TaskRun[]> {
    const response = await apiClient.get<TaskRun[]>(API_ENDPOINTS.tasks.runs(taskUuid))
    return response.data
  },
  async getTaskRun(runUuid: string): Promise<TaskRun> {
    const response = await apiClient.get<TaskRun>(API_ENDPOINTS.tasks.runDetail(runUuid))
    return response.data
  },
}
```

Create `src/features/tasks/hooks/use-tasks.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks.api'
import type { TaskFormValues } from '../types'

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...taskKeys.lists(), filters] as const,
  runs: (taskUuid: string) => [...taskKeys.all, taskUuid, 'runs'] as const,
}

export function useTasks(filters?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => tasksApi.getTasks(filters),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TaskFormValues) => tasksApi.createTask(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskUuid, data }: { taskUuid: string; data: Partial<TaskFormValues> }) =>
      tasksApi.updateTask(taskUuid, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskUuid: string) => tasksApi.deleteTask(taskUuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskKeys.lists() }),
  })
}

export function useRunTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskUuid: string) => tasksApi.runTask(taskUuid),
    onSuccess: (_run, taskUuid) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.runs(taskUuid) })
    },
  })
}
```

Create `src/features/tasks/hooks/use-task-runs.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks.api'
import { taskKeys } from './use-tasks'

export function useTaskRuns(taskUuid: string | null) {
  return useQuery({
    queryKey: taskUuid ? taskKeys.runs(taskUuid) : taskKeys.runs(''),
    queryFn: () => tasksApi.getTaskRuns(taskUuid as string),
    enabled: !!taskUuid,
  })
}
```

- [ ] **Step 5: 运行 API 测试**

Run:

```bash
pnpm exec vitest run --config vitest.config.ts src/features/tasks/api/tasks.api.test.ts
```

Expected:

```text
PASS  src/features/tasks/api/tasks.api.test.ts
```

- [ ] **Step 6: 提交前端 API 层**

```bash
git add src/config/api.ts src/features/tasks
git commit -m "feat: add task center frontend API"
```

---

## Task 8: 前端任务中心页面

**Files:**
- Create: `src/routes/_authenticated/tasks/index.tsx`
- Create: `src/features/tasks/index.tsx`
- Create: `src/features/tasks/components/task-form-sheet.tsx`
- Create: `src/features/tasks/components/task-table.tsx`
- Create: `src/features/tasks/components/task-run-drawer.tsx`
- Modify: `src/components/layout/data/sidebar-data.ts`
- Modify: `src/routeTree.gen.ts`

- [ ] **Step 1: 新增页面入口**

Create `src/routes/_authenticated/tasks/index.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { Tasks } from '@/features/tasks'

export const Route = createFileRoute('/_authenticated/tasks/')({
  component: Tasks,
})
```

- [ ] **Step 2: 新增菜单**

Modify `src/components/layout/data/sidebar-data.ts`:

```typescript
import { ClipboardList } from "lucide-react";
```

在“智能对话”和“技能管理”之间插入：

```typescript
        {
          title: "任务中心",
          url: "/tasks",
          icon: ClipboardList,
        },
```

- [ ] **Step 3: 实现列表组件**

Create `src/features/tasks/components/task-table.tsx`:

```typescript
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Task } from '../types'

interface TaskTableProps {
  tasks: Task[]
  onRun: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onShowRuns: (task: Task) => void
}

export function TaskTable({ tasks, onRun, onEdit, onDelete, onShowRuns }: TaskTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>任务</TableHead>
          <TableHead>智能服务</TableHead>
          <TableHead>Skill</TableHead>
          <TableHead>调度</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.taskUuid}>
            <TableCell>
              <div className="font-medium">{task.name}</div>
              <div className="text-sm text-muted-foreground">{task.description || '无描述'}</div>
            </TableCell>
            <TableCell>{task.chatServerName}</TableCell>
            <TableCell>{task.skillName}</TableCell>
            <TableCell>{task.scheduleType}</TableCell>
            <TableCell><Badge variant={task.status === 'active' ? 'default' : 'secondary'}>{task.status}</Badge></TableCell>
            <TableCell className="space-x-2 text-right">
              <Button size="sm" variant="outline" onClick={() => onRun(task)}>执行一次</Button>
              <Button size="sm" variant="ghost" onClick={() => onShowRuns(task)}>运行记录</Button>
              <Button size="sm" variant="ghost" onClick={() => onEdit(task)}>编辑</Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(task)}>删除</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 4: 实现表单 Sheet**

Create `src/features/tasks/components/task-form-sheet.tsx` with controlled local state and existing `useActiveChatServers`:

```typescript
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useActiveChatServers, useMySkills } from '@/features/skills/hooks/use-skills'
import type { Task, TaskFormValues, TaskScheduleType } from '../types'

interface TaskFormSheetProps {
  open: boolean
  task: Task | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TaskFormValues) => void
}

const emptyValues: TaskFormValues = {
  name: '',
  description: '',
  chatServerId: '',
  skillId: '',
  prompt: '',
  scheduleType: 'manual',
  scheduleConfig: null,
  timeoutSeconds: 300,
}

export function TaskFormSheet({ open, task, onOpenChange, onSubmit }: TaskFormSheetProps) {
  const [values, setValues] = useState<TaskFormValues>(emptyValues)
  const { data: chatServers = [] } = useActiveChatServers()
  const { data: skills = [] } = useMySkills()

  useEffect(() => {
    if (task) {
      setValues({
        name: task.name,
        description: task.description ?? '',
        chatServerId: task.chatServerId,
        skillId: task.skillId,
        prompt: task.prompt,
        scheduleType: task.scheduleType,
        scheduleConfig: task.scheduleConfig,
        timeoutSeconds: task.timeoutSeconds,
      })
    } else {
      setValues(emptyValues)
    }
  }, [task, open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{task ? '编辑任务' : '新建任务'}</SheetTitle>
        </SheetHeader>
        <form className="mt-6 space-y-5" onSubmit={(event) => {
          event.preventDefault()
          onSubmit(values)
        }}>
          <div className="space-y-2">
            <Label>任务名称</Label>
            <Input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>任务描述</Label>
            <Input value={values.description ?? ''} onChange={(event) => setValues({ ...values, description: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>智能服务</Label>
            <Select value={values.chatServerId} onValueChange={(chatServerId) => setValues({ ...values, chatServerId })}>
              <SelectTrigger><SelectValue placeholder="请选择智能服务" /></SelectTrigger>
              <SelectContent>{chatServers.map((server) => <SelectItem key={server.chatId} value={server.chatId}>{server.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Skill</Label>
            <Select value={values.skillId} onValueChange={(skillId) => setValues({ ...values, skillId })}>
              <SelectTrigger><SelectValue placeholder="请选择 Skill" /></SelectTrigger>
              <SelectContent>{skills.map((skill) => <SelectItem key={skill.skillId} value={skill.skillId}>{skill.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>执行提示词</Label>
            <Textarea value={values.prompt} rows={8} onChange={(event) => setValues({ ...values, prompt: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>执行方式</Label>
            <Select value={values.scheduleType} onValueChange={(scheduleType: TaskScheduleType) => setValues({ ...values, scheduleType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">手动</SelectItem>
                <SelectItem value="daily">每天</SelectItem>
                <SelectItem value="weekly">每周</SelectItem>
                <SelectItem value="monthly">每月</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>超时时间（秒）</Label>
            <Input type="number" value={values.timeoutSeconds} onChange={(event) => setValues({ ...values, timeoutSeconds: Number(event.target.value) })} />
          </div>
          <Button type="submit" className="w-full">保存任务</Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 5: 实现运行记录抽屉**

Create `src/features/tasks/components/task-run-drawer.tsx`:

```typescript
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useTaskRuns } from '../hooks/use-task-runs'
import type { Task } from '../types'

interface TaskRunDrawerProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskRunDrawer({ task, open, onOpenChange }: TaskRunDrawerProps) {
  const { data: runs = [] } = useTaskRuns(task?.taskUuid ?? null)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{task?.name ?? '任务'}运行记录</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {runs.map((run) => (
            <div key={run.runUuid} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Badge>{run.status}</Badge>
                <span className="text-sm text-muted-foreground">{run.createdAt}</span>
              </div>
              <div className="mt-3 text-sm">
                <div className="font-medium">输入</div>
                <pre className="mt-1 whitespace-pre-wrap rounded bg-muted p-3">{run.input.prompt}</pre>
              </div>
              {run.output && <pre className="mt-3 whitespace-pre-wrap rounded bg-muted p-3 text-sm">{run.output}</pre>}
              {run.errorMessage && <pre className="mt-3 whitespace-pre-wrap rounded bg-destructive/10 p-3 text-sm text-destructive">{run.errorMessage}</pre>}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 6: 实现页面组合**

Create `src/features/tasks/index.tsx`:

```typescript
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskFormSheet } from './components/task-form-sheet'
import { TaskRunDrawer } from './components/task-run-drawer'
import { TaskTable } from './components/task-table'
import { useCreateTask, useDeleteTask, useRunTask, useTasks, useUpdateTask } from './hooks/use-tasks'
import type { Task, TaskFormValues } from './types'

export function Tasks() {
  const [formOpen, setFormOpen] = useState(false)
  const [runDrawerOpen, setRunDrawerOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const { data: tasks = [], isLoading } = useTasks()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const runTask = useRunTask()

  const handleSubmit = async (values: TaskFormValues) => {
    try {
      if (selectedTask) {
        await updateTask.mutateAsync({ taskUuid: selectedTask.taskUuid, data: values })
        toast.success('任务已更新')
      } else {
        await createTask.mutateAsync(values)
        toast.success('任务已创建')
      }
      setFormOpen(false)
      setSelectedTask(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    }
  }

  return (
    <>
      <Header>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">任务中心</h1>
              <p className="text-sm text-muted-foreground">把智能服务和 Skills 组合成可重复执行的自动化任务</p>
            </div>
            <Button onClick={() => { setSelectedTask(null); setFormOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" />新建任务
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader><CardTitle>总任务</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{tasks.length}</CardContent></Card>
            <Card><CardHeader><CardTitle>运行中</CardTitle></CardHeader><CardContent className="text-2xl font-bold">0</CardContent></Card>
            <Card><CardHeader><CardTitle>今日成功</CardTitle></CardHeader><CardContent className="text-2xl font-bold">0</CardContent></Card>
            <Card><CardHeader><CardTitle>今日失败</CardTitle></CardHeader><CardContent className="text-2xl font-bold">0</CardContent></Card>
          </div>
          <Card>
            <CardContent className="p-0">
              {isLoading ? <div className="p-6 text-sm text-muted-foreground">加载中...</div> : (
                <TaskTable
                  tasks={tasks}
                  onRun={(task) => runTask.mutate(task.taskUuid)}
                  onEdit={(task) => { setSelectedTask(task); setFormOpen(true) }}
                  onDelete={(task) => deleteTask.mutate(task.taskUuid)}
                  onShowRuns={(task) => { setSelectedTask(task); setRunDrawerOpen(true) }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
      <TaskFormSheet open={formOpen} task={selectedTask} onOpenChange={setFormOpen} onSubmit={handleSubmit} />
      <TaskRunDrawer open={runDrawerOpen} task={selectedTask} onOpenChange={setRunDrawerOpen} />
    </>
  )
}
```

- [ ] **Step 7: 更新 route tree**

Run:

```bash
pnpm build
```

Expected includes no TypeScript errors and updates `src/routeTree.gen.ts` if route generation runs as part of Vite/TanStack plugin.

- [ ] **Step 8: 提交前端页面**

```bash
git add src/routes/_authenticated/tasks/index.tsx src/features/tasks src/components/layout/data/sidebar-data.ts src/routeTree.gen.ts
git commit -m "feat: add task center UI"
```

---

## Task 9: 收口测试与修正

**Files:**
- Modify: files changed by previous tasks only.

- [ ] **Step 1: Prisma 验证**

Run:

```bash
pnpm exec prisma format
pnpm exec prisma validate
```

Expected:

```text
The schema at prisma/schema.prisma is valid
```

- [ ] **Step 2: 后端目标测试**

Run:

```bash
pnpm exec vitest run --config vitest.config.ts server/__tests__/unit/services/tasks.service.test.ts server/__tests__/unit/services/task-runner.service.test.ts server/__tests__/unit/services/task-scheduler.service.test.ts server/__tests__/unit/routes/tasks.routes.test.ts
```

Expected:

```text
Test Files  4 passed
```

- [ ] **Step 3: 前端目标测试**

Run:

```bash
pnpm exec vitest run --config vitest.config.ts src/features/tasks/api/tasks.api.test.ts
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 4: Lint**

Run:

```bash
pnpm lint
```

Expected:

```text
0 problems
```

- [ ] **Step 5: Build**

Run:

```bash
pnpm build
```

Expected:

```text
vite build
✓ built
```

- [ ] **Step 6: 手动 API 验证**

Start server:

```bash
pnpm dev:server
```

Use an authenticated browser session or copied bearer token, then verify:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/tasks
```

Expected:

```json
[]
```

- [ ] **Step 7: 最终提交**

```bash
git status --short
git add server src prisma
git commit -m "feat: implement task center MVP"
```

---

## Self-Review

**Spec coverage**
- 覆盖任务 CRUD：Task 3、Task 5、Task 8。
- 覆盖暂停/恢复：Task 3、Task 5，前端第一版可在 Task 8 后补按钮。
- 覆盖 Skills-only：Task 3 的 `UserSkill` 校验固定为 Skill。
- 覆盖绑定 active Chat Server：Task 3 校验 `chatServer.status === 'active'`。
- 覆盖已装载 Skill：Task 3 校验 `userSkill`。
- 覆盖手动运行和运行记录：Task 4、Task 5、Task 8。
- 覆盖简单调度：Task 6。
- 覆盖路由和菜单：Task 8。

**Known implementation gap**
- `POST /api/tasks/test-run` 在 Task 5 中先返回 501；执行实现时应在 Task 4 后补 `runUnsavedTask()`，将 `CreateTaskDto` 校验后创建 `task_runs` 且 `taskId = null`。如果必须严格满足 MVP，先补该方法再进入 Task 8。
- 前端表单第一版使用 `useMySkills()` 展示我的技能，没有按所选 Chat Server 过滤。执行实现时应新增后端接口 `GET /api/chat-servers/:chatId/skills` 或复用现有装载关系接口，确保只展示当前 Chat Server 已装载 Skills。
- 统计卡片第一版页面先显示总数，运行中/今日成功/今日失败需要增加 `GET /api/tasks/stats` 或从运行记录聚合后补齐。

**Placeholder scan**
- 本计划没有 `TBD`、`TODO`、`implement later`。
- 两个 Known implementation gap 是显式收口项，不应跳过；执行时优先把它们并入对应任务。

**Type consistency**
- 后端对外任务 ID 使用 `taskUuid`。
- 前端 `Task.skillId` 表示业务 `Skill.skillId`，后端数据库 `Task.skillId` 表示内部 BigInt，通过 DTO 转换为业务 ID。
- OpenCode 执行细节只暴露在 `OpenCodeTaskClient` 和 `TaskRunnerService` 内，Controller 不直接调用 OpenCode。
