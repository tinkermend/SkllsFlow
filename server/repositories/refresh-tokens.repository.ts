import { BaseRepository } from './base.repository.js';
import { Prisma, RefreshToken } from '@prisma/client';
import { DatabaseService } from '../services/database.service.js';

export class RefreshTokenRepository extends BaseRepository<
  RefreshToken,
  Prisma.RefreshTokenCreateInput,
  Prisma.RefreshTokenUpdateInput,
  Prisma.RefreshTokenWhereInput,
  Prisma.RefreshTokenOrderByWithRelationInput
> {
  protected get modelName(): string {
    return 'refreshToken';
  }

  /**
   * 创建刷新令牌
   */
  async createToken(
    userId: bigint,
    tokenHash: string,
    expiresAt: Date,
    meta?: { deviceId?: string; ipAddress?: string; userAgent?: string }
  ) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        deviceId: meta?.deviceId,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    });
  }

  /**
   * 根据哈希查找令牌
   */
  async findByTokenHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  /**
   * 标记令牌已轮换
   */
  async rotateToken(id: bigint, newHash: string, newExpiresAt: Date) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: {
        tokenHash: newHash,
        rotatedAt: new Date(),
        expiresAt: newExpiresAt,
      },
    });
  }

  /**
   * 撤销令牌
   */
  async revokeTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * 删除过期令牌
   */
  async deleteExpiredTokens() {
    return this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }

  /**
   * 查找用户的所有活跃令牌
   */
  async findActiveTokensByUserId(userId: bigint) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 撤销令牌（通过 ID）
   */
  async revokeToken(id: bigint) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository(
  DatabaseService.getInstance()
);
