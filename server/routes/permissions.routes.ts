import express from 'express';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';
import { requirePermissions } from '../middleware/rbac.middleware.js';
import * as permissionsController from '../controllers/permissions.controller.js';

const router = express.Router();

// 所有路由需要认证
router.use(jwtAuthMiddleware);

/**
 * @route   GET /api/permissions
 * @desc    获取权限列表
 * @access  Private + permission:view
 */
router.get(
  '/',
  requirePermissions('permission:view'),
  permissionsController.listPermissions
);

/**
 * @route   POST /api/permissions/sync
 * @desc    同步权限
 * @access  Private + permission:sync
 */
router.post(
  '/sync',
  requirePermissions('permission:sync'),
  permissionsController.syncPermissions
);

export default router;
