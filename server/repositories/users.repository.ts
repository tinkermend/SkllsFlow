import { BaseRepository } from './base.repository.js';
import { type Prisma, type User } from '@prisma/client';
import { DatabaseService } from '../services/database.service.js';

export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereInput,
  Prisma.UserOrderByWithRelationInput
> {
  protected get modelName(): string {
    return 'user';
  }

  /**
   * 通过账号查找用户
   */
  async findByAccountNo(accountNo: string) {
    return this.prisma.user.findUnique({
      where: { accountNo },
    });
  }

  /**
   * 通过邮箱查找用户
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * 通过 userId (UUID) 查找用户
   */
  async findByUserId(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { userUUId: userId },
    });
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { userUUId: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * 查询用户及其角色
   */
  async findWithRoles(userId: string) {
    return this.prisma.user.findUnique({
      where: { userUUId: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }
}

let _userRepository: UserRepository | null = null;

export function getUserRepository(): UserRepository {
  if (!_userRepository) {
    _userRepository = new UserRepository(DatabaseService.getInstance());
  }
  return _userRepository;
}
