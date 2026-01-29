import express from 'express';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';
import * as devicesController from '../controllers/devices.controller.js';

const router = express.Router();

// 所有路由需要认证
router.use(jwtAuthMiddleware);

/**
 * @route   GET /api/devices
 * @desc    获取当前用户的所有活跃设备
 * @access  Private
 */
router.get('/', devicesController.getDevices);

/**
 * @route   DELETE /api/devices/:tokenId
 * @desc    踢出指定设备（撤销刷新令牌）
 * @access  Private
 */
router.delete('/:tokenId', devicesController.revokeDevice);

export default router;
