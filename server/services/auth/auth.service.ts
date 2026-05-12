import crypto from 'crypto';
import { DatabaseService } from '../database.service.js';
import { passwordService } from './password.service.js';
import { jwtService, type JWTPayload } from './jwt.service.js';
import { getUserRepository } from '../../repositories/users.repository.js';
import { getRefreshTokenRepository } from '../../repositories/refresh-tokens.repository.js';

export interface LoginInput {
  accountNo: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}

export interface RegisterInput {
  accountNo: string;
  email: string;
  password: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}

export interface AuthResponse {
  user: {
    userId: string;  // 改为 UUID (对外 API)
    accountNo: string;
    email: string;
    username?: string | null;
    avatar?: string | null;
    permissions?: string[];  // 添加权限列表
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private get prisma() {
    return DatabaseService.getInstance();
  }
  private readonly refreshTokenTtlDays = 7;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 30;

  /**
   * 用户登录
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    // 1. 查找用户（包含角色和权限信息）
    const user = await this.prisma.user.findUnique({
      where: { accountNo: input.accountNo },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user) {
      throw new Error('用户不存在');
    }

    // 2. 检查账户是否被锁定
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
      );
      throw new Error(`账户已被锁定，请在 ${remainingMinutes} 分钟后重试`);
    }

    // 3. 检查用户状态
    if (user.status !== 'active') {
      throw new Error('用户已被禁用');
    }

    // 4. 验证密码
    const isValid = await passwordService.verify(input.password, user.passwordHash);
    if (!isValid) {
      // 密码错误，增加失败计数
      await this.handleLoginFailure(user.id, user.loginFailedCount);
      throw new Error('密码错误');
    }

    // 5. 密码正确，重置失败计数和锁定状态
    await this.resetLoginFailures(user.id);

    // 6. 生成令牌
    const tokenPayload: Omit<JWTPayload, 'type'> = {
      userId: user.userUUId,  // 使用 userUUId 字段 (UUID，对外 API)
      accountNo: user.accountNo,
      email: user.email,
    };

    const accessToken = jwtService.generateAccessToken(tokenPayload);
    const refreshToken = jwtService.generateRefreshToken(tokenPayload);
    await this.persistRefreshToken(user.id, refreshToken, {  // 保持 BigInt (内部关联)
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      deviceId: input.deviceId,
    });

    // 7. 更新最后登录时间
    await getUserRepository().updateLastLogin(user.userUUId);  // 使用 userUUId 字段 (UUID)

    // 8. 提取用户权限列表
    const permissions = user.userRoles.flatMap(userRole =>
      userRole.role.rolePermissions.map(rp => rp.permission.code)
    );

    return {
      user: {
        userId: user.userUUId,  // 使用 userUUId 字段 (UUID，对外 API)
        accountNo: user.accountNo,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        permissions,  // 添加权限列表
      },
      accessToken,
      refreshToken,
      expiresIn: jwtService.getAccessTokenExpiresIn(),
    };
  }

  /**
   * 用户注册
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    // 1. 验证密码强度
    const strengthCheck = passwordService.validateStrength(input.password);
    if (!strengthCheck.valid) {
      throw new Error(strengthCheck.errors.join(', '));
    }

    // 2. 检查账号是否已存在
    const existingUser = await getUserRepository().findByAccountNo(input.accountNo);
    if (existingUser) {
      throw new Error('账号已存在');
    }

    // 3. 检查邮箱是否已存在
    const existingEmail = await getUserRepository().findByEmail(input.email);
    if (existingEmail) {
      throw new Error('邮箱已被使用');
    }

    // 4. 哈希密码
    const passwordHash = await passwordService.hash(input.password);

    // 5. 创建用户
    const user = await this.prisma.user.create({
      data: {
        accountNo: input.accountNo,
        email: input.email,
        passwordHash,
        username: input.username,
        status: 'active',
      },
    });

    // 6. 分配默认角色 (普通用户)
    const userRole = await this.prisma.role.findUnique({
      where: { code: 'user' },
    });

    if (userRole) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: userRole.id,
        },
      });
    }

    // 7. 生成令牌
    const tokenPayload: Omit<JWTPayload, 'type'> = {
      userId: user.userUUId,  // 使用 userUUId 字段 (UUID，对外 API)
      accountNo: user.accountNo,
      email: user.email,
    };

    const accessToken = jwtService.generateAccessToken(tokenPayload);
    const refreshToken = jwtService.generateRefreshToken(tokenPayload);
    await this.persistRefreshToken(user.id, refreshToken, {  // 保持 BigInt (内部关联)
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      deviceId: input.deviceId,
    });

    return {
      user: {
        userId: user.userUUId,  // 使用 userUUId 字段 (UUID，对外 API)
        accountNo: user.accountNo,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
      expiresIn: jwtService.getAccessTokenExpiresIn(),
    };
  }

  /**
   * 刷新令牌
   */
  async refresh(
    refreshToken: string
  ): Promise<Pick<AuthResponse, 'accessToken' | 'refreshToken' | 'expiresIn'>> {
    // 1. 验证刷新令牌
    let payload: JWTPayload;
    try {
      payload = jwtService.verify(refreshToken);
    } catch {
      throw new Error('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // 2. 检查令牌是否存在
    const hashed = this.hashToken(refreshToken);
    const tokenRecord = await getRefreshTokenRepository().findByTokenHash(hashed);
    if (!tokenRecord) {
      throw new Error('Refresh token not found');
    }

    if (tokenRecord.revokedAt) {
      throw new Error('Refresh token has been revoked');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new Error('Refresh token has expired');
    }

    // 3. 检查用户是否存在
    const user = await getUserRepository().findByUserId(payload.userId);  // 改为使用 UUID 查找
    if (!user || user.status !== 'active') {
      throw new Error('User not found or disabled');
    }

    // 4. 生成新的访问令牌
    const newTokenPayload: Omit<JWTPayload, 'type'> = {
      userId: user.userUUId,  // 使用 userUUId 字段 (UUID，对外 API)
      accountNo: user.accountNo,
      email: user.email,
    };

    const accessToken = jwtService.generateAccessToken(newTokenPayload);
    const newRefreshToken = jwtService.generateRefreshToken(newTokenPayload);

    const newExpires = new Date();
    newExpires.setDate(newExpires.getDate() + this.refreshTokenTtlDays);
    await getRefreshTokenRepository().rotateToken(
      tokenRecord.id,
      this.hashToken(newRefreshToken),
      newExpires
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: jwtService.getAccessTokenExpiresIn(),
    };
  }

  /**
   * 用户登出
   */
  async logout(refreshToken: string): Promise<void> {
    await getRefreshTokenRepository().revokeTokenByHash(this.hashToken(refreshToken));
  }

  /**
   * 获取当前用户信息
   */
  async me(userId: string) {  // 改为 string (UUID，来自 JWT)
    const user = await getUserRepository().findByUserId(userId);  // 使用 UUID 查找
    if (!user) {
      throw new Error('User not found');
    }

    const { permissions, roles } = await this.getUserPermissionsAndRoles(user.id);  // 保持 BigInt (内部查询)

    return {
      user: {
        userId: user.userUUId,  // 使用 userUUId 字段 (UUID，对外 API)
        accountNo: user.accountNo,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
      permissions,
      roles,
    };
  }

  /**
   * 获取用户权限和角色
   */
  private async getUserPermissionsAndRoles(userId: bigint) {
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithRoles) {
      return { permissions: [], roles: [] };
    }

    const roles = userWithRoles.userRoles.map((ur) => ur.role.code);

    const permissions = userWithRoles.userRoles
      .flatMap((ur) => ur.role.rolePermissions)
      .map((rp) => rp.permission.code)
      .filter((code, index, self) => self.indexOf(code) === index); // 去重

    return { permissions, roles };
  }

  /**
   * 哈希令牌
   */
  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * 持久化刷新令牌
   */
  private async persistRefreshToken(
    userId: bigint,
    refreshToken: string,
    meta?: { ipAddress?: string; userAgent?: string; deviceId?: string }
  ) {
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + this.refreshTokenTtlDays);

    await getRefreshTokenRepository().createToken(
      userId,
      this.hashToken(refreshToken),
      refreshTokenExpiresAt,
      meta
    );
  }

  /**
   * 处理登录失败
   */
  private async handleLoginFailure(userId: bigint, currentFailedCount: number) {
    const newFailedCount = currentFailedCount + 1;

    if (newFailedCount >= this.MAX_LOGIN_ATTEMPTS) {
      // 达到最大失败次数，锁定账户
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + this.LOCKOUT_DURATION_MINUTES);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          loginFailedCount: newFailedCount,
          lockedUntil,
        },
      });
    } else {
      // 增加失败计数
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          loginFailedCount: newFailedCount,
        },
      });
    }
  }

  /**
   * 重置登录失败计数
   */
  private async resetLoginFailures(userId: bigint) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        loginFailedCount: 0,
        lockedUntil: null,
      },
    });
  }
}

let _authService: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!_authService) {
    _authService = new AuthService();
  }
  return _authService;
}
