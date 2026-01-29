import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;  // 改为 string (UUID)
  accountNo: string;
  email: string;
  type: 'access' | 'refresh';
}

export class JWTService {
  /**
   * 生成访问令牌
   */
  generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },  // 移除 .toString()，userId 已经是 string
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
    );
  }

  /**
   * 生成刷新令牌
   */
  generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh' },  // 移除 .toString()，userId 已经是 string
      JWT_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      }
    );
  }

  /**
   * 验证令牌
   */
  verify(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        ...decoded,
        userId: decoded.userId,  // 移除 BigInt() 转换，userId 已经是 string
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * 解码令牌 (不验证)
   */
  decode(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded) return null;
      return {
        ...decoded,
        userId: decoded.userId,  // 移除 BigInt() 转换，userId 已经是 string
      };
    } catch {
      return null;
    }
  }

  /**
   * 计算访问令牌过期时间 (毫秒)
   */
  getAccessTokenExpiresIn(): number {
    const match = JWT_EXPIRES_IN.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // 默认 15 分钟

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }
}

export const jwtService = new JWTService();
