import express from 'express';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';
import { requirePermissions } from '../middleware/rbac.middleware.js';
import * as usersController from '../controllers/users.controller.js';

const router = express.Router();

// 所有路由需要认证
router.use(jwtAuthMiddleware);

/**
 * @route   GET /api/users
 * @desc    获取用户列表
 * @access  Private + user:view
 */
router.get('/', requirePermissions('user:view'), usersController.getUsers);

/**
 * @route   POST /api/users
 * @desc    创建新用户
 * @access  Private + user:create
 */
router.post('/', requirePermissions('user:create'), usersController.createUser);

/**
 * @route   GET /api/users/:id
 * @desc    获取用户详情
 * @access  Private + user:view
 */
router.get(
  '/:id',
  requirePermissions('user:view'),
  usersController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    更新用户信息
 * @access  Private + user:update
 */
router.put(
  '/:id',
  requirePermissions('user:update'),
  usersController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    删除用户
 * @access  Private + user:delete
 */
router.delete(
  '/:id',
  requirePermissions('user:delete'),
  usersController.deleteUser
);

/**
 * @route   PUT /api/users/:id/roles
 * @desc    分配角色
 * @access  Private + user:assign-roles
 */
router.put(
  '/:id/roles',
  requirePermissions('user:assign-roles'),
  usersController.assignRoles
);

export default router;
