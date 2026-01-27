import express from 'express'
import cors from 'cors'
import openCodeRoutes from './routes/opencode.routes'
import skillsRoutes from './routes/skills.routes'
import { openCodeService } from './services/opencode.service'

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// 路由
app.use('/api/opencode', openCodeRoutes)
app.use('/api/skills', skillsRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// 错误处理
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('Shutting down...')
  await openCodeService.cleanupAll()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGTERM', async () => {
  console.log('Shutting down...')
  await openCodeService.cleanupAll()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default app
