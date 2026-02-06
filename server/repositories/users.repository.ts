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
    console.log('[DEBUG] findByUserId - 查询用户，userId:', userId);

    const user = await this.prisma.user.findUnique({
      where: { userUUId: userId },
    });

    if (user) {
      console.log('[DEBUG] findByUserId - 找到用户:', { id: user.id.toString(), userUUId: user.userUUId, accountNo: user.accountNo, email: user.email });
    } else {
      console.log('[DEBUG] findByUserId - 未找到用户，userId:', userId);
    }

    return user;
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

  /**
   * 通过 UUID 查找用户（别名方法，与 findByUserId 相同）
   */
  async findByUUID(userUUId: string) {
    return this.findByUserId(userUUId);
  }

  /**
   * 分页查询用户列表
   */
  async findManyWithPagination(params: {
    skip: number;
    take: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        where,
        orderBy,
        select: {
          id: true,
          userUUId: true,
          accountNo: true,
          email: true,
          username: true,
          avatar: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          userRoles: {
            include: {
              role: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }
}

let _userRepository: UserRepository | null = null;

export function getUserRepository(): UserRepository {
  if (!_userRepository) {
    _userRepository = new UserRepository(DatabaseService.getInstance());
  }
  return _userRepository;
}
