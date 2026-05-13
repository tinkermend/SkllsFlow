import { describe, expect, it, vi } from 'vitest';

vi.mock('@server/controllers/tasks.controller', () => ({
  TasksController: class {
    listTasks = vi.fn();
    createTask = vi.fn();
    getTask = vi.fn();
    updateTask = vi.fn();
    deleteTask = vi.fn();
    pauseTask = vi.fn();
    resumeTask = vi.fn();
    runTask = vi.fn();
    testRun = vi.fn();
    listRuns = vi.fn();
    getRun = vi.fn();
  },
}));

vi.mock('@server/middleware/jwt-auth.middleware', () => ({
  jwtAuthMiddleware: 'jwtAuthMiddleware',
}));

const useCalls: unknown[][] = [];
const routeCalls: Array<{
  method: 'get' | 'post' | 'patch' | 'delete';
  path: string;
  handlers: unknown[];
}> = [];

vi.mock('express', () => ({
  Router: () => ({
    use: vi.fn((...handlers: unknown[]) => {
      useCalls.push(handlers);
    }),
    get: vi.fn((path: string, ...handlers: unknown[]) => {
      routeCalls.push({ method: 'get', path, handlers });
    }),
    post: vi.fn((path: string, ...handlers: unknown[]) => {
      routeCalls.push({ method: 'post', path, handlers });
    }),
    patch: vi.fn((path: string, ...handlers: unknown[]) => {
      routeCalls.push({ method: 'patch', path, handlers });
    }),
    delete: vi.fn((path: string, ...handlers: unknown[]) => {
      routeCalls.push({ method: 'delete', path, handlers });
    }),
  }),
}));

describe('tasks routes', () => {
  it('registers task center endpoints behind jwt auth', async () => {
    useCalls.length = 0;
    routeCalls.length = 0;
    await import('@server/routes/tasks.routes');

    expect(useCalls[0]).toEqual(['jwtAuthMiddleware']);
    expect(routeCalls).toEqual([
      expect.objectContaining({ method: 'get', path: '/' }),
      expect.objectContaining({ method: 'post', path: '/' }),
      expect.objectContaining({ method: 'post', path: '/test-run' }),
      expect.objectContaining({ method: 'get', path: '/runs/:runUuid' }),
      expect.objectContaining({ method: 'get', path: '/:taskUuid' }),
      expect.objectContaining({ method: 'patch', path: '/:taskUuid' }),
      expect.objectContaining({ method: 'delete', path: '/:taskUuid' }),
      expect.objectContaining({ method: 'post', path: '/:taskUuid/run' }),
      expect.objectContaining({ method: 'post', path: '/:taskUuid/pause' }),
      expect.objectContaining({ method: 'post', path: '/:taskUuid/resume' }),
      expect.objectContaining({ method: 'get', path: '/:taskUuid/runs' }),
    ]);
  });
});
