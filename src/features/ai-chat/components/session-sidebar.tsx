import { Separator } from '@/components/ui/separator'
import { useChatStore } from '@/stores/chat-store'
import { ServerSidebar } from './server-sidebar'
import { ChatSessionList } from './chat-session-list'

export function SessionSidebar() {
  const { activeServer, setActiveServer } = useChatStore()

  return (
    <div className='flex h-full w-64 flex-col border-r bg-card'>
      {/* 上半部分：智能服务 */}
      <ServerSidebar
        activeServerId={activeServer?.chatId}
        onServerSelect={setActiveServer}
      />

      {/* 中部：分割线 */}
      <Separator className='my-2' />

      {/* 下半部分：对话列表 */}
      <ChatSessionList />
    </div>
  )
}
