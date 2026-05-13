import { type Prisma, type PrismaClient, type TaskRun } from '@prisma/client';
import { BaseRepository } from './base.repository.js';
import {
  type TaskRunWithTask,
  taskRunWithTaskInclude,
} from '../types/task.types.js';

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
    return this.prisma.taskRun.create({
      data,
      include: taskRunWithTaskInclude,
    });
  }

  async updateRun(
    id: bigint,
    data: Prisma.TaskRunUncheckedUpdateInput
  ): Promise<TaskRunWithTask> {
    return this.prisma.taskRun.update({
      where: { id },
      data,
      include: taskRunWithTaskInclude,
    });
  }

  async findByRunUuid(runUuid: string): Promise<TaskRunWithTask | null> {
    return this.prisma.taskRun.findUnique({
      where: { runUuid },
      include: taskRunWithTaskInclude,
    });
  }

  async findByTaskId(taskId: bigint): Promise<TaskRunWithTask[]> {
    return this.prisma.taskRun.findMany({
      where: { taskId },
      include: taskRunWithTaskInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
