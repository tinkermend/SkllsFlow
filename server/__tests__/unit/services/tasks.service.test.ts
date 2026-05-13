import { describe, expect, it, vi } from 'vitest';
import { TasksService } from '@server/services/tasks.service';

describe('TasksService', () => {
  function createTaskRecord() {
    return {
      id: 4n,
      taskUuid: 'task-uuid',
      name: '每日巡检',
      description: null,
      chatServerId: 2n,
      skillId: 3n,
      prompt: '执行巡检',
      scheduleType: 'daily',
      scheduleConfig: { time: '10:30' },
      timeoutSeconds: 300,
      status: 'paused',
      lastRunAt: null,
      nextRunAt: null,
      createdBy: 1n,
      createdAt: new Date('2026-05-13T00:00:00.000Z'),
      updatedAt: new Date('2026-05-13T00:00:00.000Z'),
      chatServer: {
        id: 2n,
        chatId: 'chat-server-uuid',
        name: '默认会话',
        host: '127.0.0.1',
        port: 4096,
        status: 'active',
      },
      skill: {
        id: 3n,
        skillId: 'skill-business-id',
        name: '巡检 Skill',
        status: 'active',
      },
      _count: { runs: 0 },
    };
  }

  function createService(overrides: Record<string, unknown> = {}) {
    const repositories = {
      userSkills: {
        findLoadedSkill: vi.fn().mockResolvedValue({ id: 10n }),
      },
      usersRepository: {
        findByUserId: vi.fn().mockResolvedValue({ id: 1n }),
      },
      chatServerRepository: {
        findByChatId: vi.fn().mockResolvedValue({
          id: 2n,
          chatId: 'chat-server-uuid',
          status: 'active',
          createdBy: 1n,
        }),
      },
      skillsRepository: {
        findBySkillId: vi.fn().mockResolvedValue({
          id: 3n,
          skillId: 'skill-business-id',
          status: 'active',
        }),
      },
      tasksRepository: {
        createTask: vi.fn().mockResolvedValue({
          id: 4n,
          taskUuid: 'task-uuid',
          name: '每日巡检',
          description: null,
          chatServerId: 2n,
          skillId: 3n,
          prompt: '执行巡检',
          scheduleType: 'manual',
          scheduleConfig: null,
          timeoutSeconds: 300,
          status: 'active',
          lastRunAt: null,
          nextRunAt: null,
          createdBy: 1n,
          createdAt: new Date('2026-05-13T00:00:00.000Z'),
          updatedAt: new Date('2026-05-13T00:00:00.000Z'),
          chatServer: {
            id: 2n,
            chatId: 'chat-server-uuid',
            name: '默认会话',
            host: '127.0.0.1',
            port: 4096,
            status: 'active',
          },
          skill: {
            id: 3n,
            skillId: 'skill-business-id',
            name: '巡检 Skill',
            status: 'active',
          },
          _count: { runs: 0 },
        }),
        findByTaskUuidForUser: vi.fn(),
        findManyForUser: vi.fn(),
        updateTask: vi.fn(),
        deleteTask: vi.fn(),
      },
      ...overrides,
    };

    return {
      repositories,
      service: new TasksService(repositories),
    };
  }

  it('creates a task from chat server and skill UUIDs', async () => {
    const { repositories, service } = createService();

    const task = await service.createTask('user-uuid', {
      name: '每日巡检',
      chatServerId: 'chat-server-uuid',
      skillId: 'skill-business-id',
      prompt: '执行巡检',
      scheduleType: 'manual',
    });

    expect(repositories.usersRepository.findByUserId).toHaveBeenCalledWith('user-uuid');
    expect(repositories.chatServerRepository.findByChatId).toHaveBeenCalledWith('chat-server-uuid');
    expect(repositories.skillsRepository.findBySkillId).toHaveBeenCalledWith('skill-business-id');
    expect(repositories.userSkills.findLoadedSkill).toHaveBeenCalledWith({
      userId: 1n,
      skillId: 'skill-business-id',
      chatId: 2n,
    });
    expect(repositories.tasksRepository.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '每日巡检',
        chatServerId: 2n,
        skillId: 3n,
        createdBy: 1n,
      })
    );
    expect(task).toMatchObject({
      taskUuid: 'task-uuid',
      chatServerId: 'chat-server-uuid',
      skillId: 'skill-business-id',
      runCount: 0,
    });
  });

  it('does not require prisma when all dependencies are injected', async () => {
    const { repositories, service } = createService();

    await service.createTask('user-uuid', {
      name: '每日巡检',
      chatServerId: 'chat-server-uuid',
      skillId: 'skill-business-id',
      prompt: '执行巡检',
      scheduleType: 'manual',
    });

    expect(repositories.userSkills.findLoadedSkill).toHaveBeenCalledWith({
      userId: 1n,
      skillId: 'skill-business-id',
      chatId: 2n,
    });
  });

  it('throws when the selected skill is not loaded on the chat server', async () => {
    const { repositories, service } = createService({
      userSkills: {
        findLoadedSkill: vi.fn().mockResolvedValue(null),
      },
    });

    await expect(
      service.createTask('user-uuid', {
        name: '每日巡检',
        chatServerId: 'chat-server-uuid',
        skillId: 'skill-business-id',
        prompt: '执行巡检',
        scheduleType: 'manual',
      })
    ).rejects.toThrow('该 Skill 尚未装载到所选智能服务');
    expect(repositories.tasksRepository.createTask).not.toHaveBeenCalled();
  });

  it('resumes a task and recalculates nextRunAt for scheduled tasks', async () => {
    const task = createTaskRecord();
    const { repositories, service } = createService();
    repositories.tasksRepository.findByTaskUuidForUser.mockResolvedValue(task);
    repositories.tasksRepository.updateTask.mockImplementation(async (_id, data) => ({
      ...task,
      ...data,
      status: data.status,
      nextRunAt: data.nextRunAt,
    }));

    await service.resumeTask('user-uuid', 'task-uuid');

    expect(repositories.tasksRepository.updateTask).toHaveBeenCalledWith(
      4n,
      expect.objectContaining({
        status: 'active',
        nextRunAt: expect.any(Date),
      })
    );
  });

  it('throws required chat server message when updating chatServerId to empty string', async () => {
    const { repositories, service } = createService();
    repositories.tasksRepository.findByTaskUuidForUser.mockResolvedValue(createTaskRecord());

    await expect(
      service.updateTask('user-uuid', 'task-uuid', {
        chatServerId: '',
      })
    ).rejects.toThrow('请选择一个智能服务');
    expect(repositories.tasksRepository.updateTask).not.toHaveBeenCalled();
  });

  it('throws required skill message when updating skillId to empty string', async () => {
    const { repositories, service } = createService();
    repositories.tasksRepository.findByTaskUuidForUser.mockResolvedValue(createTaskRecord());

    await expect(
      service.updateTask('user-uuid', 'task-uuid', {
        skillId: '',
      })
    ).rejects.toThrow('请选择一个 Skill');
    expect(repositories.tasksRepository.updateTask).not.toHaveBeenCalled();
  });

  it('validates current binding when only schedule changes', async () => {
    const task = createTaskRecord();
    const { repositories, service } = createService();
    repositories.tasksRepository.findByTaskUuidForUser.mockResolvedValue(task);
    repositories.tasksRepository.updateTask.mockResolvedValue({
      ...task,
      scheduleType: 'weekly',
      scheduleConfig: { time: '11:00', dayOfWeek: 2 },
      nextRunAt: new Date('2026-05-19T03:00:00.000Z'),
    });

    await service.updateTask('user-uuid', 'task-uuid', {
      scheduleType: 'weekly',
      scheduleConfig: { time: '11:00', dayOfWeek: 2 },
    });

    expect(repositories.chatServerRepository.findByChatId).toHaveBeenCalledWith('chat-server-uuid');
    expect(repositories.skillsRepository.findBySkillId).toHaveBeenCalledWith('skill-business-id');
    expect(repositories.userSkills.findLoadedSkill).toHaveBeenCalledWith({
      userId: 1n,
      skillId: 'skill-business-id',
      chatId: 2n,
    });
    expect(repositories.tasksRepository.updateTask).toHaveBeenCalledWith(
      4n,
      expect.objectContaining({
        scheduleType: 'weekly',
        scheduleConfig: { time: '11:00', dayOfWeek: 2 },
        nextRunAt: expect.any(Date),
      })
    );
  });
});
