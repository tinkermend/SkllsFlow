import type { Prisma } from '@prisma/client';
import { serializeBigInt } from '../utils/bigint-serializer.js';

export type TaskScheduleType = 'manual' | 'daily' | 'weekly' | 'monthly';
export type TaskStatus = 'active' | 'paused' | 'disabled';
export type TaskRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
export type TaskRunTriggerType = 'manual' | 'test' | 'schedule';

export interface TaskInputSnapshot {
  taskUuid?: string;
  name: string;
  chatServerId: string;
  skillId: string;
  prompt: string;
  scheduleType: TaskScheduleType;
  scheduleConfig?: Prisma.InputJsonValue | Prisma.JsonValue | null;
  timeoutSeconds: number;
}

export interface CreateTaskDto {
  name: string;
  description?: string | null;
  chatServerId: string;
  skillId: string;
  prompt: string;
  scheduleType: TaskScheduleType;
  scheduleConfig?: Prisma.InputJsonValue | null;
  timeoutSeconds?: number;
}

export interface TaskResponseDto {
  id: string;
  taskUuid: string;
  name: string;
  description: string | null;
  chatServerId: string;
  chatServer: {
    id: string;
    chatId: string;
    name: string;
    host: string;
    port: number;
    status: string;
  };
  skillId: string;
  skill: {
    id: string;
    skillId: string;
    name: string;
    status: string;
  };
  prompt: string;
  scheduleType: TaskScheduleType;
  scheduleConfig: Prisma.JsonValue | null;
  timeoutSeconds: number;
  status: TaskStatus;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  runCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskRunResponseDto {
  id: string;
  runUuid: string;
  taskId: string | null;
  task: {
    id: string;
    taskUuid: string;
    name: string;
    chatServerId: string;
    chatServer: {
      id: string;
      chatId: string;
      name: string;
      host: string;
      port: number;
      status: string;
    };
    skillId: string;
    skill: {
      id: string;
      skillId: string;
      name: string;
      status: string;
    };
  } | null;
  status: TaskRunStatus;
  triggerType: TaskRunTriggerType;
  input: Prisma.JsonValue;
  output: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
}

export const taskRelationInclude = {
  chatServer: {
    select: {
      id: true,
      chatId: true,
      name: true,
      host: true,
      port: true,
      status: true,
    },
  },
  skill: {
    select: {
      id: true,
      skillId: true,
      name: true,
      status: true,
    },
  },
  _count: {
    select: {
      runs: true,
    },
  },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: typeof taskRelationInclude;
}>;

export const taskRunWithTaskInclude = {
  task: {
    include: {
      chatServer: {
        select: {
          id: true,
          chatId: true,
          name: true,
          host: true,
          port: true,
          status: true,
        },
      },
      skill: {
        select: {
          id: true,
          skillId: true,
          name: true,
          status: true,
        },
      },
    },
  },
} satisfies Prisma.TaskRunInclude;

export type TaskRunWithTask = Prisma.TaskRunGetPayload<{
  include: typeof taskRunWithTaskInclude;
}>;

export interface FindTasksFilters {
  search?: string;
  status?: TaskStatus;
  limit?: number;
  offset?: number;
}

export function toTaskResponseDto(task: TaskWithRelations): TaskResponseDto {
  const dto = {
    ...task,
    chatServerId: task.chatServer.chatId,
    skillId: task.skill.skillId,
    runCount: task._count.runs,
  };

  delete (dto as Partial<typeof dto>)._count;
  return serializeBigInt(dto) as unknown as TaskResponseDto;
}

export function toTaskRunResponseDto(run: TaskRunWithTask): TaskRunResponseDto {
  const dto = {
    ...run,
    task: run.task
      ? {
          id: run.task.id,
          taskUuid: run.task.taskUuid,
          name: run.task.name,
          chatServerId: run.task.chatServer.chatId,
          chatServer: run.task.chatServer,
          skillId: run.task.skill.skillId,
          skill: run.task.skill,
        }
      : null,
  };

  return serializeBigInt(dto) as unknown as TaskRunResponseDto;
}
