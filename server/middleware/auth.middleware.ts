import type { Request, Response, NextFunction } from 'express'

// 简单的认证中间件
// 实际项目中应该使用 JWT 或 Session 验证
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 从请求中获取用户 ID
  // 这里简化处理，实际应该从 JWT token 或 session 中获取
  const userId = req.headers['x-user-id'] as string

  if (!userId) {
    // 开发环境下使用默认用户
    // 生产环境应设置 REQUIRE_AUTH=true
    if (!process.env.REQUIRE_AUTH) {
      req.userId = 'dev-user-1'
      return next()
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing user authentication',
    })
  }

  req.userId = userId
  next()
}

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}
