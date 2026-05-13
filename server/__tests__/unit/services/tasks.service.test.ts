import { describe, expect, it, vi } from 'vitest';
import { TasksService } from '@server/services/tasks.service';

describe('TasksService', () => {
  it('creates a task from chat server and skill UUIDs', async () => {
    const repositories = {
      usersRepository: {
        findByUserId: vi.fn().mockResolvedValue({ id: 1n }),
      },
      chatServerRepository: {
        findByChatId: vi.fn().mockResolvedValue({ id: 2n, chatId: 'chat-server-uuid' }),
      },
      skillsRepository: {
        findBySkillId: vi.fn().mockResolvedValue({ id: 3n, skillId: 'skill-business-id' }),
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
      },
    };
    const service = new TasksService(repositories);

    const task = await service.createTask('user-uuid', {
      name: '每日巡检',
      chatServerId: 'chat-server-uuid',
      skillId: 'skill-business-id',
      prompt: '执行巡检',
      scheduleType: 'manual',
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
});
