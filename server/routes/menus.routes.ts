import express from 'express';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';
import { requirePermissions } from '../middleware/rbac.middleware.js';
import * as menusController from '../controllers/menus.controller.js';

const router = express.Router();

// 所有路由需要认证
router.use(jwtAuthMiddleware);

/**
 * @route   GET /api/menus
 * @desc    获取所有菜单（树形结构）
 * @access  Private + menu:view
 */
router.get('/', requirePermissions('menu:view'), menusController.listMenus);

/**
 * @route   GET /api/menus/user
 * @desc    获取当前用户的菜单
 * @access  Private
 */
router.get('/user', menusController.getUserMenus);

/**
 * @route   GET /api/menus/:id
 * @desc    获取菜单详情
 * @access  Private + menu:view
 */
router.get('/:id', requirePermissions('menu:view'), menusController.getMenuById);

/**
 * @route   POST /api/menus
 * @desc    创建菜单
 * @access  Private + menu:create
 */
router.post('/', requirePermissions('menu:create'), menusController.createMenu);

/**
 * @route   PUT /api/menus/:id
 * @desc    更新菜单
 * @access  Private + menu:update
 */
router.put('/:id', requirePermissions('menu:update'), menusController.updateMenu);

/**
 * @route   DELETE /api/menus/:id
 * @desc    删除菜单
 * @access  Private + menu:delete
 */
router.delete('/:id', requirePermissions('menu:delete'), menusController.deleteMenu);

export default router;
