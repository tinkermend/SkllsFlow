import express from 'express';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新令牌
 * @access  Public
 */
router.post('/refresh', authController.refresh);

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', jwtAuthMiddleware, authController.me);

export default router;
