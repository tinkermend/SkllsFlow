import { Request, Response } from 'express';
import { DatabaseService } from '../services/database.service.js';

function getPrisma() {
  return DatabaseService.getInstance();
}

export async function listPermissions(req: Request, res: Response) {
  const { module } = req.query;
  const permissions = await getPrisma().permission.findMany({
    where: module ? { module: module as string } : {},
    orderBy: [{ module: 'asc' }, { action: 'asc' }],
  });

  res.json(permissions);
}

export async function syncPermissions(req: Request, res: Response) {
  // 允许通过脚本同步前端声明到数据库
  const { permissions } = req.body;

  await getPrisma().$transaction(async (tx) => {
    for (const perm of permissions) {
      await tx.permission.upsert({
        where: { code: perm.code },
        update: perm,
        create: perm,
      });
    }
  });

  res.json({ message: '权限同步完成' });
}
