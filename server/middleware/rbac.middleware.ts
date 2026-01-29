import { type Request, type Response, type NextFunction } from 'express';
import { getRBACService } from '../services/auth/rbac.service.js';

/**
 * 要求指定权限 (AND)
 */
export function requirePermissions(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: '未登录' });
    }

    try {
      const hasPermission = await getRBACService().hasAllPermissions(
        req.userId!,
        permissions
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `需要权限: ${permissions.join(', ')}`,
        });
      }

      next();
    } catch (error) {
      return res
        .status(500)
        .json({ error: 'Internal Server Error', message: '权限检查失败' });
    }
  };
}

/**
 * 要求任一权限 (OR)
 */
export function requireAnyPermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: '未登录' });
    }

    try {
      const hasPermission = await getRBACService().hasAnyPermission(
        req.userId!,
        permissions
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `需要以下任一权限: ${permissions.join(', ')}`,
        });
      }

      next();
    } catch (error) {
      return res
        .status(500)
        .json({ error: 'Internal Server Error', message: '权限检查失败' });
    }
  };
}

/**
 * 要求指定角色
 */
export function requireRoles(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: '未登录' });
    }

    try {
      const hasAllRoles = await Promise.all(
        roles.map((role) => getRBACService().hasRole(req.userId!, role))
      );

      if (!hasAllRoles.every(Boolean)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `需要角色: ${roles.join(', ')}`,
        });
      }

      next();
    } catch (error) {
      return res
        .status(500)
        .json({ error: 'Internal Server Error', message: '角色检查失败' });
    }
  };
}

/**
 * 要求任一角色
 */
export function requireAnyRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: '未登录' });
    }

    try {
      const hasAnyRole = await getRBACService().hasAnyRole(req.userId!, roles);

      if (!hasAnyRole) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `需要以下任一角色: ${roles.join(', ')}`,
        });
      }

      next();
    } catch (error) {
      return res
        .status(500)
        .json({ error: 'Internal Server Error', message: '角色检查失败' });
    }
  };
}
