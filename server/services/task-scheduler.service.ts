import { createRequire } from 'node:module';
import { Prisma, type PrismaClient } from '@prisma/client';
import { TasksRepository } from '../repositories/tasks.repository.js';
import { type TaskScheduleType, type TaskWithRelations } from '../types/task.types.js';
import { TaskRunnerService } from './task-runner.service.js';
import { TasksService } from './tasks.service.js';

const require = createRequire(import.meta.url);

type TasksRepositoryLike = {
  findDueTasks(now: Date, limit?: number): Promise<TaskWithRelations[]>;
  updateTask(id: bigint, data: Prisma.TaskUncheckedUpdateInput): Promise<TaskWithRelations>;
};

type TaskRunnerServiceLike = {
  runTaskRecord(task: TaskWithRelations, triggerType: 'schedule'): Promise<unknown>;
};

type TasksServiceLike = {
  calculateNextRunAt(
    scheduleType: TaskScheduleType,
    config: Prisma.JsonValue | Prisma.InputJsonValue | null | undefined,
    from: Date
  ): Date | null;
};

type TaskSchedulerServiceDeps = {
  prisma?: PrismaClient;
  tasks?: TasksRepositoryLike;
  runner?: TaskRunnerServiceLike;
  tasksService?: TasksServiceLike;
  intervalMs?: number;
};

export class TaskSchedulerService {
  private readonly deps: TaskSchedulerServiceDeps;
  private readonly intervalMs: number;
  private prismaInstance: PrismaClient | null;
  private tasksInstance: TasksRepositoryLike | null = null;
  private runnerInstance: TaskRunnerServiceLike | null = null;
  private tasksServiceInstance: TasksServiceLike | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private currentTickPromise: Promise<void> | null = null;
  private readonly runningTaskIds = new Set<string>();

  constructor(deps: TaskSchedulerServiceDeps = {}) {
    this.deps = deps;
    this.intervalMs = deps.intervalMs ?? 60_000;
    this.prismaInstance = deps.prisma ?? null;
  }

  start(): void {
    if (this.timer) {
      return;
    }

    this.runTrackedTick(new Date());
    this.timer = setInterval(() => {
      this.runTrackedTick(new Date());
    }, this.intervalMs);
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    await this.currentTickPromise;
  }

  async tick(now: Date): Promise<void> {
    let dueTasks: TaskWithRelations[];
    try {
      dueTasks = await this.tasks.findDueTasks(now);
    } catch (error) {
      console.error('Task scheduler failed to find due tasks:', error);
      return;
    }

    await Promise.all(dueTasks.map((task) => this.runDueTask(task, now)));
  }

  private runTrackedTick(now: Date): void {
    const tickPromise = this.tick(now)
      .catch((error) => {
        console.error('Task scheduler tick failed:', error);
      })
      .finally(() => {
        if (this.currentTickPromise === tickPromise) {
          this.currentTickPromise = null;
        }
      });

    this.currentTickPromise = tickPromise;
  }

  private async runDueTask(task: TaskWithRelations, now: Date): Promise<void> {
    const taskId = task.id.toString();
    if (this.runningTaskIds.has(taskId)) {
      return;
    }

    this.runningTaskIds.add(taskId);
    try {
      const nextRunAt = this.tasksService.calculateNextRunAt(
        task.scheduleType,
        task.scheduleConfig,
        now
      );
      const updatedTask = await this.tasks.updateTask(task.id, {
        nextRunAt,
      });

      await this.runner.runTaskRecord(updatedTask, 'schedule');
    } catch (error) {
      console.error(`Task scheduler failed to run task ${task.taskUuid}:`, error);
    } finally {
      this.runningTaskIds.delete(taskId);
    }
  }

  private get tasks(): TasksRepositoryLike {
    if (!this.tasksInstance) {
      this.tasksInstance = this.deps.tasks ?? new TasksRepository(this.ensurePrisma());
    }

    return this.tasksInstance;
  }

  private get runner(): TaskRunnerServiceLike {
    if (!this.runnerInstance) {
      this.runnerInstance =
        this.deps.runner ?? new TaskRunnerService({ prisma: this.ensurePrisma() });
    }

    return this.runnerInstance;
  }

  private get tasksService(): TasksServiceLike {
    if (!this.tasksServiceInstance) {
      this.tasksServiceInstance =
        this.deps.tasksService ?? new TasksService({ prisma: this.ensurePrisma() });
    }

    return this.tasksServiceInstance;
  }

  private ensurePrisma(): PrismaClient {
    if (!this.prismaInstance) {
      const { DatabaseService } = require('./database.service.js') as typeof import('./database.service.js');
      this.prismaInstance = DatabaseService.getInstance();
    }

    return this.prismaInstance;
  }
}

export const taskSchedulerService = new TaskSchedulerService();
