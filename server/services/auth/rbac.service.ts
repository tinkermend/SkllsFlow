import { DatabaseService } from '../database.service.js';

export class RBACService {
  private get prisma() {
    return DatabaseService.getInstance();
  }

  /**
   * 获取用户的所有权限代码
   */
  async getUserPermissions(userId: bigint): Promise<string[]> {
    const permissions = await this.prisma.permission.findMany({
      where: {
        rolePermissions: {
          some: {
            role: {
              userRoles: {
                some: { userId },
              },
            },
          },
        },
      },
      select: { code: true },
    });

    return permissions.map((p) => p.code);
  }

  /**
   * 检查用户是否拥有指定权限
   */
  async hasPermission(userId: bigint, permission: string): Promise<boolean> {
    const count = await this.prisma.permission.count({
      where: {
        code: permission,
        rolePermissions: {
          some: {
            role: {
              userRoles: {
                some: { userId },
              },
            },
          },
        },
      },
    });

    return count > 0;
  }

  /**
   * 检查用户是否拥有任一权限
   */
  async hasAnyPermission(userId: bigint, permissions: string[]): Promise<boolean> {
    const count = await this.prisma.permission.count({
      where: {
        code: { in: permissions },
        rolePermissions: {
          some: {
            role: {
              userRoles: {
                some: { userId },
              },
            },
          },
        },
      },
    });

    return count > 0;
  }

  /**
   * 检查用户是否拥有所有权限
   */
  async hasAllPermissions(userId: bigint, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.every((p) => userPermissions.includes(p));
  }

  /**
   * 检查用户是否拥有指定角色
   */
  async hasRole(userId: bigint, roleCode: string): Promise<boolean> {
    const count = await this.prisma.userRole.count({
      where: {
        userId,
        role: { code: roleCode },
      },
    });

    return count > 0;
  }

  /**
   * 检查用户是否拥有任一角色
   */
  async hasAnyRole(userId: bigint, roleCodes: string[]): Promise<boolean> {
    const count = await this.prisma.userRole.count({
      where: {
        userId,
        role: { code: { in: roleCodes } },
      },
    });

    return count > 0;
  }
}

let _rbacService: RBACService | null = null;

export function getRBACService(): RBACService {
  if (!_rbacService) {
    _rbacService = new RBACService();
  }
  return _rbacService;
}
