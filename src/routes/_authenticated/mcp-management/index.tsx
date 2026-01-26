import { Blocks } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/mcp-management/')({
  component: McpManagementPage,
})

function McpManagementPage() {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-2 p-4">
      <Blocks size={72} />
      <h1 className="text-4xl font-bold leading-tight">MCP 管理</h1>
      <p className="text-center text-muted-foreground">
        该功能正在开发中，敬请期待！
      </p>
    </div>
  )
}
