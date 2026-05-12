 

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type Request, type Response, type NextFunction } from 'express';
import { optionalJwtAuthMiddleware } from '@server/middleware/jwt-auth.middleware';
import { requirePermissions } from '@server/middleware/rbac.middleware';
import { getRBACService } from '@server/services/auth/rbac.service';

vi.mock('@server/services/auth/rbac.service', () => ({
  getRBACService: vi.fn(),
}));

vi.mock('@server/services/auth/jwt.service', () => ({
  jwtService: {
    verify: vi.fn(),
  },
}));

vi.mock('@server/repositories/users.repository', () => ({
  getUserRepository: vi.fn(),
}));

describe('RBAC Middleware', () => {
  const responseFactory = () =>
    ({
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }) as any as Response;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requirePermissions', () => {
    it('should call next() when user has required permission', async () => {
      const req = {
        userId: 'test-user-id',
        user: {
          userId: 'test-user-id',
          accountNo: 'test_admin',
        },
      } as any as Request;

      vi.mocked(getRBACService).mockReturnValue({
        hasAllPermissions: vi.fn().mockResolvedValue(true),
      } as any);

      const res = responseFactory();
      const next = vi.fn() as NextFunction;

      const middleware = requirePermissions('user:view');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 when user lacks required permission', async () => {
      const req = {
        userId: 'test-user-id',
        user: {
          userId: 'test-user-id',
          accountNo: 'test_user',
        },
      } as any as Request;

      vi.mocked(getRBACService).mockReturnValue({
        hasAllPermissions: vi.fn().mockResolvedValue(false),
      } as any);

      const res = responseFactory();

      const next = vi.fn() as NextFunction;

      const middleware = requirePermissions('user:delete');
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalJwtAuthMiddleware', () => {
    it('should call next once when no token is provided', async () => {
      const req = {
        headers: {},
      } as Request;
      const res = responseFactory();
      const next = vi.fn() as NextFunction;

      await optionalJwtAuthMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
