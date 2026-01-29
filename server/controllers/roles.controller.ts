import { type Request, type Response } from 'express';
import { DatabaseService } from '../services/database.service.js';

function getPrisma() {
  return DatabaseService.getInstance();
}

/**
 * 将对象中的 BigInt 转换为 String
 */
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = serializeBigInt(obj[key]);
    }
    return result;
  }

  return obj;
}

export async function listRoles(req: Request, res: Response) {
  const roles = await getPrisma().role.findMany({
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
    orderBy: { sort: 'asc' },
  });
  res.json(serializeBigInt(roles));
}

export async function createRole(req: Request, res: Response) {
  const { name, code, description, permissionIds } = req.body;

  const role = await getPrisma().role.create({
    data: {
      name,
      code,
      description,
      rolePermissions: {
        create: permissionIds?.map((permissionId: bigint) => ({
          permissionId,
        })),
      },
    },
  });

  res.status(201).json(serializeBigInt(role));
}

export async function updateRole(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, status, permissionIds } = req.body;

  const role = await getPrisma().$transaction(async (tx) => {
    await tx.role.update({
      where: { id: BigInt(id) },
      data: { name, description, status },
    });

    await tx.rolePermission.deleteMany({ where: { roleId: BigInt(id) } });
    if (permissionIds?.length) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId: bigint) => ({
          roleId: BigInt(id),
          permissionId,
        })),
      });
    }

    return tx.role.findUnique({
      where: { id: BigInt(id) },
      include: { rolePermissions: { include: { permission: true } } },
    });
  });

  res.json(serializeBigInt(role));
}
