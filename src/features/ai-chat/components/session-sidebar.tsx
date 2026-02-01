import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { ServerSidebar } from './server-sidebar'
import { ChatSessionList } from './chat-session-list'

export function SessionSidebar() {
  const [currentServerId, setCurrentServerId] = useState<string>()

  const handleServerSelect = (serverId: string) => {
    setCurrentServerId(serverId)
    // TODO: 根据选中的服务加载对应的会话列表
  }

  return (
    <div className='flex h-full w-64 flex-col border-r bg-card'>
      {/* 上半部分：智能服务 */}
      <ServerSidebar currentServerId={currentServerId} onServerSelect={handleServerSelect} />

      {/* 中部：分割线 */}
      <Separator className='my-2' />

      {/* 下半部分：对话列表 */}
      <ChatSessionList />
    </div>
  )
}
