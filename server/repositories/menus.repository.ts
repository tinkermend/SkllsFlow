import { BaseRepository } from './base.repository.js';
import { Prisma } from '@prisma/client';

export class MenuRepository extends BaseRepository<
  any,
  Prisma.MenuCreateInput,
  Prisma.MenuUpdateInput,
  Prisma.MenuWhereInput,
  Prisma.MenuOrderByWithRelationInput
> {
  protected get modelName(): string {
    return 'menu';
  }

  /**
   * 获取所有菜单（树形结构）
   */
  async findAllWithChildren() {
    return this.prisma.menu.findMany({
      include: {
        children: {
          include: {
            children: true,
          },
          orderBy: { sort: 'asc' },
        },
      },
      where: { parentId: null },
      orderBy: { sort: 'asc' },
    });
  }

  /**
   * 根据角色获取菜单
   */
  async findByRoleId(roleId: bigint) {
    return this.prisma.menu.findMany({
      where: {
        roleMenus: {
          some: { roleId },
        },
        status: 'active',
        isVisible: true,
      },
      include: {
        children: {
          where: {
            status: 'active',
            isVisible: true,
          },
          orderBy: { sort: 'asc' },
        },
      },
      orderBy: { sort: 'asc' },
    });
  }

  /**
   * 根据用户获取菜单
   */
  async findByUserId(userId: bigint) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true },
    });

    const roleIds = userRoles.map((ur) => ur.roleId);

    return this.prisma.menu.findMany({
      where: {
        roleMenus: {
          some: {
            roleId: { in: roleIds },
          },
        },
        status: 'active',
        isVisible: true,
      },
      include: {
        children: {
          where: {
            status: 'active',
            isVisible: true,
          },
          orderBy: { sort: 'asc' },
        },
      },
      orderBy: { sort: 'asc' },
    });
  }
}

export const menuRepository = new MenuRepository(
  require('../services/database.service.js').DatabaseService.getInstance()
);
