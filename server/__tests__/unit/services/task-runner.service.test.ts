import { describe, expect, it, vi } from 'vitest';
import { TaskRunnerService } from '@server/services/task-runner.service';

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
  };
}

function createRunRecord(overrides: Record<string, unknown> = {}) {
  const task = createTaskRecord();

  return {
    id: 9n,
    runUuid: 'run-uuid',
    taskId: task.id,
    status: 'pending',
    triggerType: 'manual',
    input: {
      taskUuid: task.taskUuid,
      name: task.name,
      chatServerId: task.chatServer.chatId,
      skillId: task.skill.skillId,
      prompt: task.prompt,
      scheduleType: task.scheduleType,
      scheduleConfig: task.scheduleConfig,
      timeoutSeconds: task.timeoutSeconds,
    },
    output: null,
    errorMessage: null,
    startedAt: null,
    finishedAt: null,
    createdAt: new Date('2026-05-13T01:00:00.000Z'),
    task,
    ...overrides,
  };
}

function createService(overrides: Record<string, unknown> = {}) {
  const task = createTaskRecord();
  const run = createRunRecord();
  const taskRuns = {
    createRun: vi.fn().mockResolvedValue(run),
    updateRun: vi.fn().mockImplementation(async (_id, data) => ({
      ...run,
      ...data,
    })),
  };
  const tasksService = {
    requireTaskForUser: vi.fn().mockResolvedValue(task),
  };
  const tasks = {
    updateTask: vi.fn().mockResolvedValue({
      ...task,
      lastRunAt: new Date('2026-05-13T01:05:00.000Z'),
    }),
  };
  const opencodeClient = {
    createSession: vi.fn().mockResolvedValue('session-uuid'),
    sendMessageAndWait: vi.fn().mockResolvedValue('巡检完成'),
  };
  const deps = {
    tasksService,
    taskRuns,
    tasks,
    opencodeClient,
    ...overrides,
  };

  return {
    deps,
    service: new TaskRunnerService(deps),
    task,
    run,
  };
}

describe('TaskRunnerService', () => {
  it('runs a saved task and records a successful run', async () => {
    const { deps, service, task } = createService();

    const dto = await service.runSavedTask('user-uuid', 'task-uuid', 'manual');

    expect(deps.tasksService.requireTaskForUser).toHaveBeenCalledWith('user-uuid', 'task-uuid');
    expect(deps.taskRuns.createRun).toHaveBeenCalledWith({
      taskId: task.id,
      status: 'pending',
      triggerType: 'manual',
      input: {
        taskUuid: 'task-uuid',
        name: '每日巡检',
        chatServerId: 'chat-server-uuid',
        skillId: 'skill-business-id',
        prompt: '执行巡检',
        scheduleType: 'daily',
        scheduleConfig: { time: '10:30' },
        timeoutSeconds: 300,
      },
    });
    expect(deps.taskRuns.updateRun).toHaveBeenNthCalledWith(
      1,
      9n,
      expect.objectContaining({
        status: 'running',
        startedAt: expect.any(Date),
      })
    );
    expect(deps.opencodeClient.createSession).toHaveBeenCalledWith(task.chatServer);
    expect(deps.opencodeClient.sendMessageAndWait).toHaveBeenCalledWith({
      sessionId: 'session-uuid',
      prompt: '执行巡检',
      timeoutSeconds: 300,
    });
    expect(deps.taskRuns.updateRun).toHaveBeenNthCalledWith(
      2,
      9n,
      expect.objectContaining({
        status: 'success',
        output: '巡检完成',
        finishedAt: expect.any(Date),
      })
    );
    expect(deps.tasks.updateTask).toHaveBeenCalledWith(
      task.id,
      expect.objectContaining({
        lastRunAt: expect.any(Date),
      })
    );
    expect(dto).toMatchObject({
      status: 'success',
      output: '巡检完成',
      taskId: '4',
    });
  });

  it('returns a failed run when OpenCode execution throws', async () => {
    const error = new Error('OpenCode timeout');
    const { deps, service } = createService({
      opencodeClient: {
        createSession: vi.fn().mockResolvedValue('session-uuid'),
        sendMessageAndWait: vi.fn().mockRejectedValue(error),
      },
    });

    const dto = await service.runSavedTask('user-uuid', 'task-uuid', 'manual');

    expect(deps.taskRuns.updateRun).toHaveBeenNthCalledWith(
      2,
      9n,
      expect.objectContaining({
        status: 'failed',
        errorMessage: 'OpenCode timeout',
        finishedAt: expect.any(Date),
      })
    );
    expect(deps.tasks.updateTask).not.toHaveBeenCalled();
    expect(dto).toMatchObject({
      status: 'failed',
      errorMessage: 'OpenCode timeout',
    });
  });
});
