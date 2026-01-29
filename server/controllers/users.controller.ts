import { type Request, type Response } from 'express';
import { DatabaseService } from '../services/database.service.js';
import { serializePrisma } from '../utils/serialization.js';

function getPrisma() {
  return DatabaseService.getInstance();
}

export async function getUsers(req: Request, res: Response) {
  try {
    const { page = '1', limit = '10', search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = search
      ? {
          OR: [
            { accountNo: { contains: search as string } },
            { email: { contains: search as string } },
            { username: { contains: search as string } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      getPrisma().user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          userUUId: true, // 对外 API 使用的 UUID
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
        orderBy: { createdAt: 'desc' },
      }),
      getPrisma().user.count({ where }),
    ]);

    res.json({
      data: serializePrisma(users),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await getPrisma().user.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        userUUId: true, // 对外 API 使用的 UUID
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
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(serializePrisma(user));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { username, avatar, status } = req.body;

    const user = await getPrisma().user.update({
      where: { id: BigInt(id) },
      data: {
        username,
        avatar,
        status,
      },
      select: {
        id: true,
        userUUId: true, // 对外 API 使用的 UUID
        accountNo: true,
        email: true,
        username: true,
        avatar: true,
        status: true,
      },
    });

    res.json(serializePrisma(user));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await getPrisma().user.delete({
      where: { id: BigInt(id) },
    });

    res.json({ message: '用户删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function assignRoles(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { roleIds } = req.body;

    // 删除现有角色
    await getPrisma().userRole.deleteMany({
      where: { userId: BigInt(id) },
    });

    // 分配新角色
    await getPrisma().userRole.createMany({
      data: roleIds.map((roleId: bigint) => ({
        userId: BigInt(id),
        roleId,
      })),
    });

    res.json({ message: '角色分配成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
