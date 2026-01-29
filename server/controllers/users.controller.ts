import { type Request, type Response } from 'express';
import { DatabaseService } from '../services/database.service.js';
import { serializePrisma } from '../utils/serialization.js';
import bcrypt from 'bcrypt';
import { z } from 'zod';

function getPrisma() {
  return DatabaseService.getInstance();
}

// 创建用户验证 schema
const createUserSchema = z.object({
  accountNo: z.string()
    .min(3, '账号至少 3 位')
    .max(20, '账号最多 20 位')
    .regex(/^[a-zA-Z0-9_]+$/, '账号只能包含字母、数字、下划线'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string()
    .min(8, '密码至少 8 位')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/\d/, '密码必须包含数字'),
  username: z.string().optional(),
  avatar: z.string().url().optional(),
  roleIds: z.array(z.number()).optional(),
});

export async function createUser(req: Request, res: Response) {
  try {
    // 验证请求体
    const validatedData = createUserSchema.parse(req.body);

    // 检查账号是否已存在
    const existingAccountNo = await getPrisma().user.findUnique({
      where: { accountNo: validatedData.accountNo },
    });
    if (existingAccountNo) {
      return res.status(409).json({
        error: '账号已存在',
        code: 'ACCOUNT_EXISTS',
        details: { accountNo: validatedData.accountNo }
      });
    }

    // 检查邮箱是否已存在
    const existingEmail = await getPrisma().user.findUnique({
      where: { email: validatedData.email },
    });
    if (existingEmail) {
      return res.status(409).json({
        error: '邮箱已存在',
        code: 'EMAIL_EXISTS',
        details: { email: validatedData.email }
      });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // 创建用户
    const user = await getPrisma().user.create({
      data: {
        accountNo: validatedData.accountNo,
        email: validatedData.email,
        passwordHash,
        username: validatedData.username,
        avatar: validatedData.avatar,
        status: 'active',
      },
      select: {
        id: true,
        userUUId: true,
        accountNo: true,
        email: true,
        username: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    // 如果提供了角色 ID，分配角色
    if (validatedData.roleIds && validatedData.roleIds.length > 0) {
      await getPrisma().userRole.createMany({
        data: validatedData.roleIds.map((roleId) => ({
          userId: user.id,
          roleId: BigInt(roleId),
        })),
      });
    }

    res.status(201).json(serializePrisma(user));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '请求参数错误',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }
    res.status(500).json({ error: error.message });
  }
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
    const { username, avatar, status, password } = req.body;

    const updateData: any = {
      username,
      avatar,
      status,
    };

    // 如果提供了新密码，加密并更新
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);

      // 撤销该用户的所有刷新令牌
      await getPrisma().refreshToken.updateMany({
        where: { userId: BigInt(id) },
        data: { revokedAt: new Date() },
      });
    }

    const user = await getPrisma().user.update({
      where: { id: BigInt(id) },
      data: updateData,
      select: {
        id: true,
        userUUId: true,
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
    if (roleIds && roleIds.length > 0) {
      await getPrisma().userRole.createMany({
        data: roleIds.map((roleId: number) => ({
          userId: BigInt(id),
          roleId: BigInt(roleId),
        })),
      });
    }

    res.json({ message: '角色分配成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
