import { type Request, type Response, type NextFunction } from 'express';
import { jwtService } from '../services/auth/jwt.service.js';
import { getUserRepository } from '../repositories/users.repository.js';

/**
 * 扩展 Express Request 类型
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userInternalId?: bigint;
      user?: {
        userId: string;
        accountNo: string;
        email: string;
        id: bigint;
      };
    }
  }
}

/**
 * JWT 认证中间件
 */
export async function jwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. 从 Authorization Header 提取 token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7);

    // 2. 验证 token
    const payload = jwtService.verify(token);

    // 3. 检查 token 类型
    if (payload.type !== 'access') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token type',
      });
    }

    // 4. 将用户信息注入请求
    const userRecord = await getUserRepository().findByUserId(payload.userId);
    if (!userRecord) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
      return;
    }

    req.user = {
      userId: payload.userId,
      accountNo: payload.accountNo,
      email: payload.email,
      id: userRecord.id,
    };

    req.userId = payload.userId;
    req.userInternalId = userRecord.id;

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
    return;
  }
}

/**
 * 可选的 JWT 认证中间件 (不强制要求)
 */
export async function optionalJwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = jwtService.verify(token);

      if (payload.type === 'access') {
        const userRecord = await getUserRepository().findByUserId(payload.userId);
        if (userRecord) {
          req.user = {
            userId: payload.userId,
            accountNo: payload.accountNo,
            email: payload.email,
            id: userRecord.id,
          };
          req.userId = payload.userId;
          req.userInternalId = userRecord.id;
        }
      }
    }

    next();
  } catch {
    // Ignore optional auth failures
  }
  next();
}
