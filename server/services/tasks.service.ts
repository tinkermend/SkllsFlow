import { createRequire } from 'node:module';
import { Prisma, type PrismaClient, type Skill } from '@prisma/client';
import { ChatServerRepository } from '../repositories/chat-server.repository.js';
import { TasksRepository } from '../repositories/tasks.repository.js';
import {
  type CreateTaskDto,
  type FindTasksFilters,
  type TaskResponseDto,
  type TaskScheduleType,
  type TaskWithRelations,
  type UpdateTaskDto,
  toTaskResponseDto,
} from '../types/task.types.js';

const require = createRequire(import.meta.url);

type TaskValidationContext = {
  userId: bigint;
  chatServerId: bigint;
  skillId: bigint;
};

type TasksServiceDeps = {
  prisma?: PrismaClient;
  users?: UsersLookupRepository;
  usersRepository?: UsersLookupRepository;
  tasks?: TasksDataRepository;
  tasksRepository?: TasksDataRepository;
  chatServers?: ChatServersLookupRepository;
  chatServerRepository?: ChatServersLookupRepository;
  skills?: SkillsLookupRepository;
  skillsRepository?: SkillsLookupRepository;
  userSkills?: UserSkillsLookupRepository;
  userSkillRepository?: UserSkillsLookupRepository;
};

type ScheduleConfig = {
  time?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
};

type SkillsLookupRepository = {
  findBySkillId(skillId: string): Promise<Skill | null>;
};

type UserRecord = {
  id: bigint;
};

type ChatServerRecord = {
  id: bigint;
  chatId: string;
  status: string;
  createdBy: bigint;
};

type UsersLookupRepository = {
  findByUserId(userUuid: string): Promise<UserRecord | null>;
};

type ChatServersLookupRepository = {
  findByChatId(chatId: string): Promise<ChatServerRecord | null>;
};

type TasksDataRepository = {
  createTask(data: Prisma.TaskUncheckedCreateInput): Promise<TaskWithRelations>;
  findByTaskUuidForUser(taskUuid: string, userId: bigint): Promise<TaskWithRelations | null>;
  findManyForUser(userId: bigint, filters?: FindTasksFilters): Promise<TaskWithRelations[]>;
  updateTask(id: bigint, data: Prisma.TaskUncheckedUpdateInput): Promise<TaskWithRelations>;
  deleteTask(id: bigint): Promise<unknown>;
};

type FindLoadedSkillParams = {
  userId: bigint;
  skillId: string;
  chatId: bigint;
};

type UserSkillsLookupRepository = {
  findLoadedSkill(params: FindLoadedSkillParams): Promise<unknown | null>;
};

export class TasksService {
  private usersRepository: UsersLookupRepository;
  private tasksRepository: TasksDataRepository;
  private chatServerRepository: ChatServersLookupRepository;
  private skillsRepository: SkillsLookupRepository;
  private userSkillsRepository: UserSkillsLookupRepository;

  constructor(deps: TasksServiceDeps = {}) {
    let prismaInstance: PrismaClient | null = deps.prisma ?? null;
    const ensurePrisma = () => {
      if (!prismaInstance) {
        const { DatabaseService } = require('./database.service.js') as typeof import('./database.service.js');
        prismaInstance = DatabaseService.getInstance();
      }
      return prismaInstance;
    };

    this.usersRepository = deps.users ?? deps.usersRepository ?? this.createDefaultUsersRepository(ensurePrisma);
    this.tasksRepository = deps.tasks ?? deps.tasksRepository ?? new TasksRepository(ensurePrisma());
    this.chatServerRepository =
      deps.chatServers ?? deps.chatServerRepository ?? new ChatServerRepository(ensurePrisma());
    this.skillsRepository = deps.skills ?? deps.skillsRepository ?? {
      findBySkillId: (skillId: string) =>
        ensurePrisma().skill.findUnique({
          where: { skillId },
        }),
    };
    this.userSkillsRepository = deps.userSkills ?? deps.userSkillRepository ?? {
      findLoadedSkill: (params: FindLoadedSkillParams) =>
        ensurePrisma().userSkill.findFirst({
          where: params,
        }),
    };
  }

  async listTasks(userUuid: string, filters: FindTasksFilters = {}): Promise<TaskResponseDto[]> {
    const user = await this.usersRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('用户不存在');
    }

    const tasks = await this.tasksRepository.findManyForUser(user.id, filters);
    return tasks.map((task) => toTaskResponseDto(task));
  }

  async createTask(userUuid: string, dto: CreateTaskDto): Promise<TaskResponseDto> {
    this.validateRequiredFields(dto);
    const context = await this.validateTaskBinding(userUuid, dto);
    const scheduleType = dto.scheduleType;
    const scheduleConfig = dto.scheduleConfig ?? null;

    const task = await this.tasksRepository.createTask({
      name: dto.name.trim(),
      description: dto.description ?? null,
      chatServerId: context.chatServerId,
      skillId: context.skillId,
      prompt: dto.prompt.trim(),
      scheduleType,
      scheduleConfig: this.toWritableJson(scheduleConfig),
      timeoutSeconds: dto.timeoutSeconds ?? 300,
      status: 'active',
      nextRunAt: this.calculateNextRunAt(scheduleType, scheduleConfig, new Date()),
      createdBy: context.userId,
    });

    return toTaskResponseDto(task);
  }

  async getTask(userUuid: string, taskUuid: string): Promise<TaskResponseDto> {
    const task = await this.requireTaskForUser(userUuid, taskUuid);
    return toTaskResponseDto(task);
  }

  async updateTask(
    userUuid: string,
    taskUuid: string,
    dto: UpdateTaskDto
  ): Promise<TaskResponseDto> {
    const current = await this.requireTaskForUser(userUuid, taskUuid);
    const data: Prisma.TaskUncheckedUpdateInput = {};

    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw new Error('请输入任务名称');
      }
      data.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.prompt !== undefined) {
      if (!dto.prompt.trim()) {
        throw new Error('请填写任务执行提示词');
      }
      data.prompt = dto.prompt.trim();
    }

    const scheduleType = dto.scheduleType ?? current.scheduleType;
    const scheduleConfig = dto.scheduleConfig !== undefined
      ? dto.scheduleConfig
      : current.scheduleConfig;
    const bindingChanged = dto.chatServerId !== undefined || dto.skillId !== undefined;
    const scheduleChanged = dto.scheduleType !== undefined || dto.scheduleConfig !== undefined;
    const chatServerId = dto.chatServerId !== undefined
      ? dto.chatServerId
      : current.chatServer.chatId;
    const skillId = dto.skillId !== undefined
      ? dto.skillId
      : current.skill.skillId;

    const context = await this.validateTaskBinding(userUuid, {
      name: dto.name ?? current.name,
      chatServerId,
      skillId,
      prompt: dto.prompt ?? current.prompt,
      scheduleType,
      scheduleConfig: scheduleConfig as Prisma.InputJsonValue | null,
    });

    if (bindingChanged) {
      data.chatServerId = context.chatServerId;
      data.skillId = context.skillId;
    }

    if (scheduleChanged) {
      data.scheduleType = scheduleType;
      data.scheduleConfig = this.toWritableJson(scheduleConfig);
      data.nextRunAt = this.calculateNextRunAt(scheduleType, scheduleConfig, new Date());
    }

    if (dto.timeoutSeconds !== undefined) {
      data.timeoutSeconds = dto.timeoutSeconds;
    }

    const task = await this.tasksRepository.updateTask(current.id, data);
    return toTaskResponseDto(task);
  }

  async deleteTask(userUuid: string, taskUuid: string): Promise<void> {
    const task = await this.requireTaskForUser(userUuid, taskUuid);
    await this.tasksRepository.deleteTask(task.id);
  }

  async pauseTask(userUuid: string, taskUuid: string): Promise<TaskResponseDto> {
    const task = await this.requireTaskForUser(userUuid, taskUuid);
    const updated = await this.tasksRepository.updateTask(task.id, {
      status: 'paused',
    });

    return toTaskResponseDto(updated);
  }

  async resumeTask(userUuid: string, taskUuid: string): Promise<TaskResponseDto> {
    const task = await this.requireTaskForUser(userUuid, taskUuid);
    const updated = await this.tasksRepository.updateTask(task.id, {
      status: 'active',
      nextRunAt: this.calculateNextRunAt(task.scheduleType, task.scheduleConfig, new Date()),
    });

    return toTaskResponseDto(updated);
  }

  async requireTaskForUser(userUuid: string, taskUuid: string): Promise<TaskWithRelations> {
    const user = await this.usersRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('用户不存在');
    }

    const task = await this.tasksRepository.findByTaskUuidForUser(taskUuid, user.id);
    if (!task) {
      throw new Error('任务不存在');
    }

    return task;
  }

  calculateNextRunAt(
    scheduleType: TaskScheduleType,
    config: Prisma.JsonValue | Prisma.InputJsonValue | null | undefined,
    from: Date
  ): Date | null {
    if (scheduleType === 'manual') {
      return null;
    }

    const scheduleConfig = this.normalizeScheduleConfig(config);
    const [hour, minute] = this.parseTime(scheduleConfig.time);

    if (scheduleType === 'daily') {
      const next = new Date(from);
      next.setHours(hour, minute, 0, 0);
      if (next <= from) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }

    if (scheduleType === 'weekly') {
      const targetDay = this.normalizeDayOfWeek(scheduleConfig.dayOfWeek);
      const next = new Date(from);
      next.setHours(hour, minute, 0, 0);
      const dayDelta = (targetDay - next.getDay() + 7) % 7;
      next.setDate(next.getDate() + dayDelta);
      if (next <= from) {
        next.setDate(next.getDate() + 7);
      }
      return next;
    }

    const targetDay = this.normalizeDayOfMonth(scheduleConfig.dayOfMonth);
    const next = new Date(from);
    next.setDate(targetDay);
    next.setHours(hour, minute, 0, 0);
    if (next <= from) {
      next.setMonth(next.getMonth() + 1, targetDay);
    }
    return next;
  }

  private validateRequiredFields(dto: CreateTaskDto): void {
    if (!dto.name?.trim()) {
      throw new Error('请输入任务名称');
    }
    if (!dto.chatServerId?.trim()) {
      throw new Error('请选择一个智能服务');
    }
    if (!dto.skillId?.trim()) {
      throw new Error('请选择一个 Skill');
    }
    if (!dto.prompt?.trim()) {
      throw new Error('请填写任务执行提示词');
    }
  }

  private async validateTaskBinding(
    userUuid: string,
    dto: Pick<CreateTaskDto, 'name' | 'chatServerId' | 'skillId' | 'prompt' | 'scheduleType'> & {
      scheduleConfig?: Prisma.InputJsonValue | Prisma.JsonValue | null;
    }
  ): Promise<TaskValidationContext> {
    this.validateRequiredFields(dto);

    const user = await this.usersRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('用户不存在');
    }

    const chatServer = await this.chatServerRepository.findByChatId(dto.chatServerId);
    if (!chatServer || chatServer.createdBy !== user.id) {
      throw new Error('智能服务不存在');
    }
    if (chatServer.status !== 'active') {
      throw new Error('当前智能服务不可用，请先检查服务状态');
    }

    const skill = await this.skillsRepository.findBySkillId(dto.skillId);
    if (!skill || skill.status !== 'active') {
      throw new Error('Skill 不存在或已禁用');
    }

    const userSkill = await this.userSkillsRepository.findLoadedSkill({
      userId: user.id,
      skillId: skill.skillId,
      chatId: chatServer.id,
    });

    if (!userSkill) {
      throw new Error('该 Skill 尚未装载到所选智能服务');
    }

    return {
      userId: user.id,
      chatServerId: chatServer.id,
      skillId: skill.id,
    };
  }

  private normalizeScheduleConfig(
    config: Prisma.JsonValue | Prisma.InputJsonValue | null | undefined
  ): ScheduleConfig {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return {};
    }

    return config as ScheduleConfig;
  }

  private parseTime(time = '09:00'): [number, number] {
    const match = /^(\d{1,2}):(\d{2})$/.exec(time);
    if (!match) {
      return [9, 0];
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return [9, 0];
    }

    return [hour, minute];
  }

  private normalizeDayOfWeek(dayOfWeek: number | undefined): number {
    if (dayOfWeek === undefined || !Number.isInteger(dayOfWeek)) {
      return 1;
    }

    return Math.min(6, Math.max(0, dayOfWeek));
  }

  private normalizeDayOfMonth(dayOfMonth: number | undefined): number {
    if (dayOfMonth === undefined || !Number.isInteger(dayOfMonth)) {
      return 1;
    }

    return Math.min(28, Math.max(1, dayOfMonth));
  }

  private toWritableJson(
    value: Prisma.InputJsonValue | Prisma.JsonValue | null | undefined
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
    if (value === undefined) {
      return undefined;
    }

    return value === null ? Prisma.JsonNull : value as Prisma.InputJsonValue;
  }

  private createDefaultUsersRepository(
    ensurePrisma: () => PrismaClient
  ): UsersLookupRepository {
    const { UserRepository } = require('../repositories/users.repository.js') as typeof import('../repositories/users.repository.js');
    return new UserRepository(ensurePrisma());
  }
}
