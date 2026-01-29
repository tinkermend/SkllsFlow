import { Request, Response } from 'express';
import { refreshTokenRepository } from '../repositories/refresh-tokens.repository.js';

/**
 * 获取当前用户的所有活跃设备
 */
export async function getDevices(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const devices = await refreshTokenRepository.findActiveTokensByUserId(req.user.id);

    // 格式化设备信息
    const formattedDevices = devices.map((token) => ({
      id: token.id.toString(),
      deviceId: token.deviceId,
      ipAddress: token.ipAddress,
      userAgent: token.userAgent,
      createdAt: token.createdAt,
      rotatedAt: token.rotatedAt,
      lastActive: token.rotatedAt || token.createdAt,
    }));

    res.json({
      devices: formattedDevices,
      total: formattedDevices.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * 踢出指定设备（撤销刷新令牌）
 */
export async function revokeDevice(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tokenId } = req.params;

    // 验证令牌是否属于当前用户
    const token = await refreshTokenRepository.findById(BigInt(tokenId));
    if (!token) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (token.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 撤销令牌
    await refreshTokenRepository.revokeToken(BigInt(tokenId));

    res.json({ message: '设备已踢出' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
