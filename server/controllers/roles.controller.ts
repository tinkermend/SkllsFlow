import { Request, Response } from 'express';
import { DatabaseService } from '../services/database.service.js';

const prisma = DatabaseService.getInstance();

export async function listRoles(req: Request, res: Response) {
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
    orderBy: { sort: 'asc' },
  });
  res.json(roles);
}

export async function createRole(req: Request, res: Response) {
  const { name, code, description, permissionIds } = req.body;

  const role = await prisma.role.create({
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

  res.status(201).json(role);
}

export async function updateRole(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, status, permissionIds } = req.body;

  const role = await prisma.$transaction(async (tx) => {
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

  res.json(role);
}
