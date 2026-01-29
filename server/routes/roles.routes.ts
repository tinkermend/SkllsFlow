import express from 'express';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';
import { requirePermissions } from '../middleware/rbac.middleware.js';
import * as rolesController from '../controllers/roles.controller.js';

const router = express.Router();

// 所有路由需要认证
router.use(jwtAuthMiddleware);

/**
 * @route   GET /api/roles
 * @desc    获取角色列表
 * @access  Private + role:view
 */
router.get('/', requirePermissions('role:view'), rolesController.listRoles);

/**
 * @route   POST /api/roles
 * @desc    创建角色
 * @access  Private + role:create
 */
router.post('/', requirePermissions('role:create'), rolesController.createRole);

/**
 * @route   PUT /api/roles/:id
 * @desc    更新角色
 * @access  Private + role:update
 */
router.put(
  '/:id',
  requirePermissions('role:update'),
  rolesController.updateRole
);

export default router;
