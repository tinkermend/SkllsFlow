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

export async function listPermissions(req: Request, res: Response) {
  const { module } = req.query;
  const permissions = await getPrisma().permission.findMany({
    where: module ? { module: module as string } : {},
    orderBy: [{ module: 'asc' }, { action: 'asc' }],
  });

  res.json(serializeBigInt(permissions));
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
