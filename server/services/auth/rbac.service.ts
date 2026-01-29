import { DatabaseService } from '../database.service.js';

export class RBACService {
  private get prisma() {
    return DatabaseService.getInstance();
  }

  /**
   * 通过 UUID 获取用户的内部 ID
   */
  private async getUserIdByUUID(userUUID: string): Promise<bigint | null> {
    const user = await this.prisma.user.findUnique({
      where: { userUUId: userUUID },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  /**
   * 获取用户的所有权限代码
   */
  async getUserPermissions(userUUID: string): Promise<string[]> {
    const userId = await this.getUserIdByUUID(userUUID);
    if (!userId) return [];
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
  async hasPermission(userUUID: string, permission: string): Promise<boolean> {
    const userId = await this.getUserIdByUUID(userUUID);
    if (!userId) return false;

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
  async hasAnyPermission(userUUID: string, permissions: string[]): Promise<boolean> {
    const userId = await this.getUserIdByUUID(userUUID);
    if (!userId) return false;

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
  async hasAllPermissions(userUUID: string, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userUUID);
    return permissions.every((p) => userPermissions.includes(p));
  }

  /**
   * 检查用户是否拥有指定角色
   */
  async hasRole(userUUID: string, roleCode: string): Promise<boolean> {
    const userId = await this.getUserIdByUUID(userUUID);
    if (!userId) return false;

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
  async hasAnyRole(userUUID: string, roleCodes: string[]): Promise<boolean> {
    const userId = await this.getUserIdByUUID(userUUID);
    if (!userId) return false;

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
