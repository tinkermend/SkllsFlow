import { Router } from 'express'
import { openCodeService } from '../services/opencode.service'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// 所有路由都需要认证
router.use(authMiddleware)

/**
 * GET /api/opencode/connection
 * 获取用户的 OpenCode 连接信息
 */
router.get('/connection', async (req, res) => {
  try {
    const userId = req.userId!
    const result = await openCodeService.getConnection(userId)
    res.json(result)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * POST /api/opencode/start
 * 启动用户的 OpenCode 实例
 */
router.post('/start', async (req, res) => {
  try {
    const userId = req.userId!
    const result = await openCodeService.startInstance(userId)
    res.json(result)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * POST /api/opencode/stop
 * 停止用户的 OpenCode 实例
 */
router.post('/stop', async (req, res) => {
  try {
    const userId = req.userId!
    const success = await openCodeService.stopInstance(userId)
    res.json({ success })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/opencode/health
 * 检查用户的 OpenCode 实例健康状态
 */
router.get('/health', async (req, res) => {
  try {
    const userId = req.userId!
    const result = await openCodeService.checkInstanceHealth(userId)
    res.json(result)
  } catch (error) {
    res.status(500).json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
