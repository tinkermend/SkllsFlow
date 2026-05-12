 

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { getAuthService } from '@server/services/auth/auth.service';
import { DatabaseService } from '@server/services/database.service';
import { prisma } from '@server/__tests__/helpers/setup';
import { generateTestUsers, testUserPasswords } from '@server/__tests__/fixtures/users';
import { jwtService } from '@server/services/auth/jwt.service';

describe('Auth Service', () => {
  let testUsers: any[];
  const authService = getAuthService();

  beforeAll(async () => {
    await DatabaseService.connect();

    // 创建测试用户
    testUsers = await generateTestUsers();

    for (const user of testUsers) {
      await prisma.user.upsert({
        where: { accountNo: user.accountNo },
        update: user,
        create: user,
      });
    }
  });

  afterAll(async () => {
    await DatabaseService.disconnect();
  });

  describe('login', () => {
    beforeEach(async () => {
      await prisma.refreshToken.deleteMany();
    });

    it('should login successfully with correct credentials', async () => {
      const result = await authService.login({
        accountNo: 'test_admin',
        password: testUserPasswords.admin,
      });

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.accountNo).toBe('test_admin');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(jwtService.verify(result.accessToken).type).toBe('access');
    });

    it('should reset login failures only once after successful login', async () => {
      const resetSpy = vi.spyOn(authService as any, 'resetLoginFailures');

      await authService.login({
        accountNo: 'test_admin',
        password: testUserPasswords.admin,
      });

      expect(resetSpy).toHaveBeenCalledTimes(1);
      resetSpy.mockRestore();
    });

    it('should fail with incorrect password', async () => {
      await expect(
        authService.login({
          accountNo: 'test_admin',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow();
    });

    it('should fail with non-existent user', async () => {
      await expect(
        authService.login({
          accountNo: 'non_existent_user',
          password: 'Password123!',
        })
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout successfully and revoke refresh token', async () => {
      const loginResult = await authService.login({
        accountNo: 'test_user',
        password: testUserPasswords.user,
      });

      await authService.logout(loginResult.refreshToken);

      const token = await prisma.refreshToken.findFirst({
        where: {
          tokenHash: {
            not: '',
          },
          revokedAt: null,
        },
      });

      expect(token?.tokenHash).not.toBe(loginResult.refreshToken);
    });
  });

  describe('refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const loginResult = await authService.login({
        accountNo: 'test_user',
        password: testUserPasswords.user,
      });

      const refreshResult = await authService.refresh(
        loginResult.refreshToken
      );

      expect(refreshResult).toBeDefined();
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.expiresIn).toBeGreaterThan(0);
      expect(jwtService.verify(refreshResult.accessToken).type).toBe('access');
    });

    it('should fail with invalid refresh token', async () => {
      await expect(
        authService.refresh('invalid-token')
      ).rejects.toThrow();
    });
  });
});
