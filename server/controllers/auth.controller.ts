import { type Request, type Response } from 'express';
import { getAuthService } from '../services/auth/auth.service.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/api/auth',
};

export async function register(req: Request, res: Response) {
  try {
    const { accountNo, email, password, username } = req.body;

    const result = await getAuthService().register({
      accountNo,
      email,
      password,
      username,
    });

    res
      .cookie('refreshToken', result.refreshToken, {
        ...REFRESH_COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { accountNo, password } = req.body;

    const result = await getAuthService().login({
      accountNo,
      password,
    });

    res
      .cookie('refreshToken', result.refreshToken, {
        ...REFRESH_COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      await getAuthService().logout(refreshToken);
    }

    res
      .clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS)
      .json({ message: '登出成功' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken;

    const result = await getAuthService().refresh(refreshToken);

    res
      .cookie('refreshToken', result.refreshToken, {
        ...REFRESH_COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}

export async function me(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // req.user.userId 是 UUID (从 JWT Token 中提取)
    const result = await getAuthService().me(req.user.userId);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
