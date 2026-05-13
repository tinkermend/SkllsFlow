import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskSchedulerService } from '@server/services/task-scheduler.service';

function createTaskRecord(overrides: Record<string, unknown> = {}) {
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
    nextRunAt: new Date('2026-05-13T01:00:00.000Z'),
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
    ...overrides,
  };
}

function createService(overrides: Record<string, unknown> = {}) {
  const task = createTaskRecord();
  const nextRunAt = new Date('2026-05-14T02:30:00.000Z');
  const tasks = {
    findDueTasks: vi.fn().mockResolvedValue([task]),
    updateTask: vi.fn().mockResolvedValue({
      ...task,
      nextRunAt,
    }),
  };
  const runner = {
    runTaskRecord: vi.fn().mockResolvedValue({
      id: 'run-uuid',
      status: 'success',
    }),
  };
  const tasksService = {
    calculateNextRunAt: vi.fn().mockReturnValue(nextRunAt),
  };
  const deps = {
    tasks,
    runner,
    tasksService,
    ...overrides,
  };

  return {
    deps,
    service: new TaskSchedulerService(deps),
    task,
    nextRunAt,
  };
}

describe('TaskSchedulerService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs due tasks and updates nextRunAt before execution', async () => {
    const now = new Date('2026-05-13T02:00:00.000Z');
    const { deps, service, task, nextRunAt } = createService();

    await service.tick(now);

    expect(deps.tasks.findDueTasks).toHaveBeenCalledWith(now);
    expect(deps.tasksService.calculateNextRunAt).toHaveBeenCalledWith(
      'daily',
      { time: '10:30' },
      now
    );
    expect(deps.tasks.updateTask).toHaveBeenCalledWith(task.id, {
      nextRunAt,
    });
    expect(deps.runner.runTaskRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: task.id,
        nextRunAt,
      }),
      'schedule'
    );
    expect(deps.tasks.updateTask.mock.invocationCallOrder[0]).toBeLessThan(
      deps.runner.runTaskRecord.mock.invocationCallOrder[0]
    );
  });

  it('does not start the same task twice while it is already running', async () => {
    const now = new Date('2026-05-13T02:00:00.000Z');
    const task = createTaskRecord();
    let releaseRun: (() => void) | undefined;
    const running = new Promise<void>((resolve) => {
      releaseRun = resolve;
    });
    const { deps, service } = createService({
      tasks: {
        findDueTasks: vi.fn().mockResolvedValue([task]),
        updateTask: vi.fn().mockResolvedValue(task),
      },
      runner: {
        runTaskRecord: vi.fn().mockReturnValue(running),
      },
    });

    const firstTick = service.tick(now);
    await Promise.resolve();
    await service.tick(now);
    releaseRun?.();
    await firstTick;

    expect(deps.runner.runTaskRecord).toHaveBeenCalledTimes(1);
    expect(deps.tasks.updateTask).toHaveBeenCalledTimes(1);
  });

  it('waits for the current startup tick before stop resolves', async () => {
    const task = createTaskRecord();
    let releaseRun: (() => void) | undefined;
    const running = new Promise<void>((resolve) => {
      releaseRun = resolve;
    });
    const { deps, service } = createService({
      tasks: {
        findDueTasks: vi.fn().mockResolvedValue([task]),
        updateTask: vi.fn().mockResolvedValue(task),
      },
      runner: {
        runTaskRecord: vi.fn().mockReturnValue(running),
      },
      intervalMs: 60_000,
    });
    let stopResolved = false;

    service.start();
    await Promise.resolve();
    const stopPromise = service.stop().then(() => {
      stopResolved = true;
    });
    await Promise.resolve();

    expect(stopResolved).toBe(false);
    releaseRun?.();
    await stopPromise;

    expect(stopResolved).toBe(true);
    expect(deps.runner.runTaskRecord).toHaveBeenCalledTimes(1);
  });

  it('does not start a second interval tick while the first tick is still running', async () => {
    vi.useFakeTimers();
    const task = createTaskRecord();
    let releaseRun: (() => void) | undefined;
    const running = new Promise<void>((resolve) => {
      releaseRun = resolve;
    });
    const { deps, service } = createService({
      tasks: {
        findDueTasks: vi.fn().mockResolvedValue([task]),
        updateTask: vi.fn().mockResolvedValue(task),
      },
      runner: {
        runTaskRecord: vi.fn().mockReturnValue(running),
      },
      intervalMs: 1_000,
    });

    service.start();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(1_000);

    expect(deps.tasks.findDueTasks).toHaveBeenCalledTimes(1);
    releaseRun?.();
    await service.stop();
  });
});
