import 'dotenv/config'
import app from './app.js'
import { openCodeService } from './services/opencode.service.js'
import { DatabaseService } from './services/database.service.js'
import { taskSchedulerService } from './services/task-scheduler.service.js'

const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001

// 启动服务器
async function startServer() {
  try {
    // Connect to database
    await DatabaseService.connect()

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      taskSchedulerService.start()
    })

    // 优雅关闭
    const shutdown = async () => {
      console.log('Shutting down...')
      taskSchedulerService.stop()
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
