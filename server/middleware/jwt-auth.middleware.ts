import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/auth/jwt.service.js';

/**
 * 扩展 Express Request 类型
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;  // 新增：方便直接访问 UUID
      user?: {
        userId: string;  // 改为 UUID (对外 API)
        accountNo: string;
        email: string;
      };
    }
  }
}

/**
 * JWT 认证中间件
 */
export function jwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
    req.user = {
      userId: payload.userId,  // 改为 UUID (对外 API)
      accountNo: payload.accountNo,
      email: payload.email,
    };

    req.userId = payload.userId;  // 新增：方便直接访问

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * 可选的 JWT 认证中间件 (不强制要求)
 */
export function optionalJwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = jwtService.verify(token);

      if (payload.type === 'access') {
        req.user = {
          userId: payload.userId,  // 改为 UUID (对外 API)
          accountNo: payload.accountNo,
          email: payload.email,
        };
        req.userId = payload.userId;  // 新增：方便直接访问
      }
    }

    next();
  } catch {
    next();
  }
}
