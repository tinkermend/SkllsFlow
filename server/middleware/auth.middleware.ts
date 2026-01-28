import type { Request, Response, NextFunction } from 'express'

// 简单的认证中间件
// 实际项目中应该使用 JWT 或 Session 验证
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 1. 尝试从 Authorization header 获取用户 ID
  const authHeader = req.headers.authorization as string

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // 提取 Bearer token
    const token = authHeader.substring(7)
    req.userId = token
    return next()
  }

  // 2. 尝试从 x-user-id header 获取用户 ID
  const userId = req.headers['x-user-id'] as string

  if (userId) {
    req.userId = userId
    return next()
  }

  // 3. 开发环境下使用默认用户
  if (process.env.REQUIRE_AUTH !== 'true') {
    req.userId = 'dev-user-1'
    return next()
  }

  // 4. 认证失败
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Missing user authentication',
  })
}

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}
