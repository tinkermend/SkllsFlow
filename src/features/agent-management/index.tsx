import { Network } from 'lucide-react'

export function AgentManagementPage() {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-2 p-4">
      <Network size={72} />
      <h1 className="text-4xl font-bold leading-tight">Agent 管理</h1>
      <p className="text-center text-muted-foreground">
        该功能正在开发中，敬请期待！
      </p>
    </div>
  )
}
