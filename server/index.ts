import 'dotenv/config'
import express, { type Express } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import openCodeRoutes from './routes/opencode.routes.js'
import skillsRoutes from './routes/skills.routes.js'
import sessionsRoutes from './routes/sessions.routes.js'
import authRoutes from './routes/auth.routes.js'
import usersRoutes from './routes/users.routes.js'
import rolesRoutes from './routes/roles.routes.js'
import permissionsRoutes from './routes/permissions.routes.js'
import devicesRoutes from './routes/devices.routes.js'
import menusRoutes from './routes/menus.routes.js'
import mcpRoutes from './routes/mcp.routes.js'
import directoriesRoutes from './routes/directories.routes.js'
import chatServerRoutes from './routes/chat-server.routes.js'
import { openCodeService } from './services/opencode.service.js'
import { DatabaseService } from './services/database.service.js'
import { metricsEndpoint } from './utils/metrics.js'
import { errorHandler } from './middleware/error-handler.js'

const app: Express = express()
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// 路由
app.use('/api/opencode', openCodeRoutes)
app.use('/api/skills', skillsRoutes)
app.use('/api/sessions', sessionsRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/roles', rolesRoutes)
app.use('/api/permissions', permissionsRoutes)
app.use('/api/devices', devicesRoutes)
app.use('/api/menus', menusRoutes)
app.use('/api/mcp', mcpRoutes)
app.use('/api/directories', directoriesRoutes)
app.use('/api/chat-servers', chatServerRoutes)

// 健康检查
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const db = DatabaseService.getInstance()
    await db.$queryRaw`SELECT 1`

    res.json({
      status: 'ok',
      database: 'healthy'
    })
  } catch (error) {
    res.json({
      status: 'ok',
      database: 'unhealthy'
    })
  }
})

// 指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain')
  res.end(await metricsEndpoint())
})

// 错误处理
app.use(errorHandler)

// 启动服务器
async function startServer() {
  try {
    // Connect to database
    await DatabaseService.connect()

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })

    // 优雅关闭
    const shutdown = async () => {
      console.log('Shutting down...')
      await openCodeService.cleanupAll()
      await DatabaseService.disconnect()
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app
