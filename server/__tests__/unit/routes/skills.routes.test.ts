import { describe, expect, it, vi } from 'vitest';

vi.mock('@server/controllers/skills.controller', () => ({
  SkillsController: class {
    createSkill = vi.fn();
    getMySkills = vi.fn();
    getSkillFiles = vi.fn();
    downloadSkillFile = vi.fn();
    getSkillLoadedServers = vi.fn();
    loadSkillToChatServer = vi.fn();
    uninstallMySkill = vi.fn();
    deleteSkill = vi.fn();
    getAllPlatformSkills = vi.fn();
    updateSkill = vi.fn();
    getSkillRelatedSessions = vi.fn();
  },
}));

vi.mock('@server/middleware/jwt-auth.middleware', () => ({
  jwtAuthMiddleware: 'jwtAuthMiddleware',
}));

vi.mock('@server/middleware/upload.middleware', () => ({
  upload: {
    single: vi.fn(() => 'uploadSingleFile'),
  },
}));

const routeCalls: Array<{
  method: 'get' | 'post' | 'patch' | 'delete';
  path: string;
  handlers: unknown[];
}> = [];

vi.mock('express', () => ({
  Router: () => ({
    use: vi.fn(),
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

describe('skills routes', () => {
  it('registers frontend-consumed skill endpoints', async () => {
    routeCalls.length = 0;
    await import('@server/routes/skills.routes');

    expect(routeCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: 'patch', path: '/:skillId' }),
        expect.objectContaining({ method: 'get', path: '/:skillId/sessions' }),
      ])
    );
  });
});
