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
    console.log('[DEBUG] jwtAuthMiddleware - 开始验证 JWT');

    // 1. 从 Authorization Header 提取 token
    const authHeader = req.headers.authorization;
    console.log('[DEBUG] jwtAuthMiddleware - authHeader:', authHeader ? '存在' : '不存在');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[DEBUG] jwtAuthMiddleware - Authorization header 无效');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7);
    console.log('[DEBUG] jwtAuthMiddleware - token 提取成功');

    // 2. 验证 token
    const payload = jwtService.verify(token);
    console.log('[DEBUG] jwtAuthMiddleware - payload:', { userId: payload.userId, accountNo: payload.accountNo, email: payload.email, type: payload.type });

    // 3. 检查 token 类型
    if (payload.type !== 'access') {
      console.log('[DEBUG] jwtAuthMiddleware - token 类型无效:', payload.type);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token type',
      });
    }

    // 4. 将用户信息注入请求
    console.log('[DEBUG] jwtAuthMiddleware - 查询用户，userId:', payload.userId);
    const userRecord = await getUserRepository().findByUserId(payload.userId);
    if (!userRecord) {
      console.log('[DEBUG] jwtAuthMiddleware - 用户不存在，userId:', payload.userId);
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
      return;
    }

    console.log('[DEBUG] jwtAuthMiddleware - 用户找到:', { id: userRecord.id.toString(), userUUId: userRecord.userUUId, accountNo: userRecord.accountNo });

    req.user = {
      userId: payload.userId,
      accountNo: payload.accountNo,
      email: payload.email,
      id: userRecord.id,
    };

    req.userId = payload.userId;
    req.userInternalId = userRecord.id;

    console.log('[DEBUG] jwtAuthMiddleware - req.userId:', req.userId);
    console.log('[DEBUG] jwtAuthMiddleware - req.userInternalId:', req.userInternalId?.toString());

    next();
  } catch (error) {
    console.error('[DEBUG] jwtAuthMiddleware - 发生错误:', error);
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
