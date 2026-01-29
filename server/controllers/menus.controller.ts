import { type Request, type Response } from 'express';
import { DatabaseService } from '../services/database.service.js';

function getPrisma() {
  return DatabaseService.getInstance();
}

/**
 * 获取所有菜单（树形结构）
 */
export async function listMenus(req: Request, res: Response) {
  try {
    const menus = await getPrisma().menu.findMany({
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
    res.json(menus);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * 获取菜单详情
 */
export async function getMenuById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const menu = await getPrisma().menu.findUnique({
      where: { id: BigInt(id) },
      include: {
        children: true,
      },
    });

    if (!menu) {
      return res.status(404).json({ error: '菜单不存在' });
    }

    res.json(menu);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * 创建菜单
 */
export async function createMenu(req: Request, res: Response) {
  try {
    const { name, path, icon, parentId, sort, type, permission, isVisible, isExternal, status } = req.body;

    const menu = await getPrisma().menu.create({
      data: {
        name,
        path,
        icon,
        parentId: parentId ? BigInt(parentId) : null,
        sort: sort || 0,
        type: type || 'menu',
        permission,
        isVisible: isVisible !== undefined ? isVisible : true,
        isExternal: isExternal || false,
        status: status || 'active',
      },
    });

    res.status(201).json(menu);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * 更新菜单
 */
export async function updateMenu(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, path, icon, parentId, sort, type, permission, isVisible, isExternal, status } = req.body;

    const menu = await getPrisma().menu.update({
      where: { id: BigInt(id) },
      data: {
        name,
        path,
        icon,
        parentId: parentId ? BigInt(parentId) : null,
        sort,
        type,
        permission,
        isVisible,
        isExternal,
        status,
      },
    });

    res.json(menu);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * 删除菜单
 */
export async function deleteMenu(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // 检查是否有子菜单
    const childrenCount = await getPrisma().menu.count({
      where: { parentId: BigInt(id) },
    });

    if (childrenCount > 0) {
      return res.status(400).json({ error: '该菜单下有子菜单，无法删除' });
    }

    await getPrisma().menu.delete({
      where: { id: BigInt(id) },
    });

    res.json({ message: '菜单删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * 获取用户菜单
 */
export async function getUserMenus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;

    // 获取用户的所有角色
    const userRoles = await getPrisma().userRole.findMany({
      where: { userId },
      select: { roleId: true },
    });

    const roleIds = userRoles.map((ur) => ur.roleId);

    // 获取角色对应的菜单
    const menus = await getPrisma().menu.findMany({
      where: {
        roleMenus: {
          some: {
            roleId: { in: roleIds },
          },
        },
        status: 'active',
        isVisible: true,
        type: 'menu',
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

    res.json(menus);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
