import { type Prisma, type PrismaClient, type Task } from '@prisma/client';
import { BaseRepository } from './base.repository.js';
import {
  type FindTasksFilters,
  type TaskWithRelations,
  taskRelationInclude,
} from '../types/task.types.js';

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
    return this.prisma.task.create({
      data,
      include: taskRelationInclude,
    });
  }

  async findByTaskUuidForUser(
    taskUuid: string,
    userId: bigint
  ): Promise<TaskWithRelations | null> {
    return this.prisma.task.findFirst({
      where: {
        taskUuid,
        createdBy: userId,
      },
      include: taskRelationInclude,
    });
  }

  async findManyForUser(
    userId: bigint,
    filters: FindTasksFilters = {}
  ): Promise<TaskWithRelations[]> {
    const where: Prisma.TaskWhereInput = {
      createdBy: userId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search?.trim()) {
      const keyword = filters.search.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { prompt: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    return this.prisma.task.findMany({
      where,
      include: taskRelationInclude,
      orderBy: [{ createdAt: 'desc' }],
      take: filters.limit,
      skip: filters.offset,
    });
  }

  async updateTask(
    id: bigint,
    data: Prisma.TaskUncheckedUpdateInput
  ): Promise<TaskWithRelations> {
    return this.prisma.task.update({
      where: { id },
      data,
      include: taskRelationInclude,
    });
  }

  async deleteTask(id: bigint): Promise<Task> {
    return this.prisma.task.delete({
      where: { id },
    });
  }

  async findDueTasks(now: Date, limit = 20): Promise<TaskWithRelations[]> {
    return this.prisma.task.findMany({
      where: {
        status: 'active',
        scheduleType: {
          not: 'manual',
        },
        nextRunAt: {
          lte: now,
        },
      },
      include: taskRelationInclude,
      orderBy: {
        nextRunAt: 'asc',
      },
      take: limit,
    });
  }
}
