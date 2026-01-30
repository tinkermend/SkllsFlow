/**
 * 自定义错误类
 */

/**
 * 业务错误基类
 */
export class BusinessError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string,
  ) {
    super(message);
    this.name = 'BusinessError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 未授权错误 (401)
 */
export class UnauthorizedError extends BusinessError {
  constructor(message: string = '未授权') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * 禁止访问错误 (403)
 */
export class ForbiddenError extends BusinessError {
  constructor(message: string = '无权限访问') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * 资源不存在错误 (404)
 */
export class NotFoundError extends BusinessError {
  constructor(message: string = '资源不存在') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * 参数验证错误 (400)
 */
export class ValidationError extends BusinessError {
  constructor(message: string = '参数验证失败') {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * 冲突错误 (409)
 */
export class ConflictError extends BusinessError {
  constructor(message: string = '资源冲突') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}
