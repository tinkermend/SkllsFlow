import { Router } from 'express';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';
import { ChatServerController } from '../controllers/chat-server.controller.js';

const router = Router();

// 所有路由需要 JWT 认证
router.use(jwtAuthMiddleware);

// 中间件：为每个请求创建 controller 实例
router.use((req, _res, next) => {
  req.controller = new ChatServerController();
  next();
});

/**
 * POST /api/chat-servers
 * 创建新的 ChatServer
 */
router.post('/', (req, res) => req.controller.create(req, res));

/**
 * GET /api/chat-servers
 * 获取用户的所有 ChatServer
 */
router.get('/', (req, res) => req.controller.getAll(req, res));

/**
 * GET /api/chat-servers/active
 * 获取用户的所有活跃 ChatServer
 */
router.get('/active', (req, res) => req.controller.getActive(req, res));

/**
 * GET /api/chat-servers/:chatId/capabilities
 * 获取 ChatServer 已加载的 Skills 与 MCP 服务
 */
router.get('/:chatId/capabilities', (req, res) =>
  req.controller.getCapabilities(req, res)
);

/**
 * GET /api/chat-servers/:chatId/delete-stats
 * 获取删除统计信息
 */
router.get('/:chatId/delete-stats', (req, res) =>
  req.controller.getDeleteStats(req, res)
);

/**
 * PATCH /api/chat-servers/:chatId/status
 * 激活或离线 ChatServer
 */
router.patch('/:chatId/status', (req, res) =>
  req.controller.setStatus(req, res)
);

/**
 * DELETE /api/chat-servers/:chatId
 * 删除指定的 ChatServer
 */
router.delete('/:chatId', (req, res) => req.controller.delete(req, res));

export default router;
