import { createRequire } from 'node:module';
import { Prisma, type PrismaClient } from '@prisma/client';
import { TaskRunsRepository } from '../repositories/task-runs.repository.js';
import { TasksRepository } from '../repositories/tasks.repository.js';
import {
  type TaskInputSnapshot,
  type TaskRunResponseDto,
  type TaskRunTriggerType,
  type TaskRunWithTask,
  type TaskWithRelations,
  toTaskRunResponseDto,
} from '../types/task.types.js';
import { TasksService } from './tasks.service.js';

const require = createRequire(import.meta.url);

type TaskRunnerChatServer = TaskWithRelations['chatServer'];

type OpenCodeSendMessageInput = {
  sessionId: string;
  prompt: string;
  timeoutSeconds: number;
};

type OpenCodeSessionResponse = {
  id?: unknown;
  sessionId?: unknown;
};

type OpenCodeMessageResponse = {
  output?: unknown;
  message?: unknown;
  content?: unknown;
};

type TasksServiceLike = {
  requireTaskForUser(userUuid: string, taskUuid: string): Promise<TaskWithRelations>;
};

type TaskRunsRepositoryLike = {
  createRun(data: Prisma.TaskRunUncheckedCreateInput): Promise<TaskRunWithTask>;
  updateRun(id: bigint, data: Prisma.TaskRunUncheckedUpdateInput): Promise<TaskRunWithTask>;
};

type TasksRepositoryLike = {
  updateTask(id: bigint, data: Prisma.TaskUncheckedUpdateInput): Promise<TaskWithRelations>;
};

type OpenCodeTaskClientLike = {
  createSession(chatServer: TaskRunnerChatServer): Promise<string>;
  sendMessageAndWait(input: OpenCodeSendMessageInput): Promise<string>;
};

type TaskRunnerServiceDeps = {
  prisma?: PrismaClient;
  tasksService?: TasksServiceLike;
  taskRuns?: TaskRunsRepositoryLike;
  tasks?: TasksRepositoryLike;
  opencodeClient?: OpenCodeTaskClientLike;
};

export class OpenCodeTaskClient implements OpenCodeTaskClientLike {
  private currentBaseUrl: string | null = null;

  async createSession(chatServer: TaskRunnerChatServer): Promise<string> {
    this.currentBaseUrl = this.buildBaseUrl(chatServer);
    const response = await fetch(`${this.currentBaseUrl}/session`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: `Task Runner - ${new Date().toISOString()}`,
      }),
    });

    const data = await this.readJson<OpenCodeSessionResponse>(response);
    const sessionId = data.id ?? data.sessionId;
    if (typeof sessionId !== 'string' || !sessionId) {
      throw new Error('OpenCode session response missing session id');
    }

    return sessionId;
  }

  async sendMessageAndWait(input: OpenCodeSendMessageInput): Promise<string> {
    if (!this.currentBaseUrl) {
      throw new Error('OpenCode session has not been created');
    }

    const response = await fetch(`${this.currentBaseUrl}/session/${encodeURIComponent(input.sessionId)}/message`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        content: input.prompt,
        message: input.prompt,
      }),
      signal: AbortSignal.timeout(input.timeoutSeconds * 1000),
    });

    const data = await this.readJson<OpenCodeMessageResponse>(response);
    return this.extractOutput(data);
  }

  private buildBaseUrl(chatServer: TaskRunnerChatServer): string {
    return `http://${chatServer.host}:${chatServer.port}`;
  }

  private async readJson<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new Error(`OpenCode request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
  }

  private extractOutput(data: OpenCodeMessageResponse): string {
    if (typeof data.output === 'string') {
      return data.output;
    }
    if (typeof data.message === 'string') {
      return data.message;
    }
    if (typeof data.content === 'string') {
      return data.content;
    }

    return '';
  }
}

export class TaskRunnerService {
  private readonly deps: TaskRunnerServiceDeps;
  private prismaInstance: PrismaClient | null;
  private tasksServiceInstance: TasksServiceLike | null = null;
  private taskRunsInstance: TaskRunsRepositoryLike | null = null;
  private tasksInstance: TasksRepositoryLike | null = null;
  private opencodeClientInstance: OpenCodeTaskClientLike | null = null;

  constructor(deps: TaskRunnerServiceDeps = {}) {
    this.deps = deps;
    this.prismaInstance = deps.prisma ?? null;
  }

  async runSavedTask(
    userUuid: string,
    taskUuid: string,
    triggerType: TaskRunTriggerType
  ): Promise<TaskRunResponseDto> {
    const task = await this.tasksService.requireTaskForUser(userUuid, taskUuid);
    return await this.runTaskRecord(task, triggerType);
  }

  async runTaskRecord(
    task: TaskWithRelations,
    triggerType: TaskRunTriggerType
  ): Promise<TaskRunResponseDto> {
    const pendingRun = await this.taskRuns.createRun({
      taskId: task.id,
      status: 'pending',
      triggerType,
      input: this.buildInputSnapshot(task) as unknown as Prisma.InputJsonObject,
    });

    const startedRun = await this.taskRuns.updateRun(pendingRun.id, {
      status: 'running',
      startedAt: new Date(),
    });

    try {
      const sessionId = await this.opencodeClient.createSession(task.chatServer);
      const output = await this.opencodeClient.sendMessageAndWait({
        sessionId,
        prompt: task.prompt,
        timeoutSeconds: task.timeoutSeconds,
      });
      const finishedAt = new Date();
      const successRun = await this.taskRuns.updateRun(startedRun.id, {
        status: 'success',
        output,
        errorMessage: null,
        finishedAt,
      });

      await this.tasks.updateTask(task.id, {
        lastRunAt: finishedAt,
      });

      return toTaskRunResponseDto(successRun);
    } catch (error) {
      const failedRun = await this.taskRuns.updateRun(startedRun.id, {
        status: 'failed',
        errorMessage: this.toErrorMessage(error),
        finishedAt: new Date(),
      });

      return toTaskRunResponseDto(failedRun);
    }
  }

  private buildInputSnapshot(task: TaskWithRelations): TaskInputSnapshot {
    return {
      taskUuid: task.taskUuid,
      name: task.name,
      chatServerId: task.chatServer.chatId,
      skillId: task.skill.skillId,
      prompt: task.prompt,
      scheduleType: task.scheduleType,
      scheduleConfig: task.scheduleConfig,
      timeoutSeconds: task.timeoutSeconds,
    };
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }

  private get tasksService(): TasksServiceLike {
    if (!this.tasksServiceInstance) {
      this.tasksServiceInstance =
        this.deps.tasksService ?? new TasksService({ prisma: this.ensurePrisma() });
    }

    return this.tasksServiceInstance;
  }

  private get taskRuns(): TaskRunsRepositoryLike {
    if (!this.taskRunsInstance) {
      this.taskRunsInstance =
        this.deps.taskRuns ?? new TaskRunsRepository(this.ensurePrisma());
    }

    return this.taskRunsInstance;
  }

  private get tasks(): TasksRepositoryLike {
    if (!this.tasksInstance) {
      this.tasksInstance =
        this.deps.tasks ?? new TasksRepository(this.ensurePrisma());
    }

    return this.tasksInstance;
  }

  private get opencodeClient(): OpenCodeTaskClientLike {
    if (!this.opencodeClientInstance) {
      this.opencodeClientInstance = this.deps.opencodeClient ?? new OpenCodeTaskClient();
    }

    return this.opencodeClientInstance;
  }

  private ensurePrisma(): PrismaClient {
    if (!this.prismaInstance) {
      const { DatabaseService } = require('./database.service.js') as typeof import('./database.service.js');
      this.prismaInstance = DatabaseService.getInstance();
    }

    return this.prismaInstance;
  }
}
