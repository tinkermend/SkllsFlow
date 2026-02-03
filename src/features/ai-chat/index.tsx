import { useChatStore } from '@/stores/chat-store'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ChatPanel } from './components/chat-panel'
import { ConnectionGuard } from './components/connection-guard'
import { SessionSidebar } from './components/session-sidebar'
import { useEventStream } from './hooks/use-event-stream'
import { useMessages } from './hooks/use-messages'
import { useActiveServerConnection } from './hooks/use-opencode-init'

export function AiChat() {
  const { currentSessionId } = useChatStore()

  // 初始化连接
  useActiveServerConnection()

  // 建立 SSE 连接
  useEventStream()

  // 获取当前会话消息
  useMessages(currentSessionId)

  return (
    <>
      {/* Header */}
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* Main Content */}
      {/* 添加 fluid 属性，移除居中和最大宽度限制，使内容与菜单栏贴合 */}
      <Main fixed fluid className='flex flex-col p-0'>
        <div className='flex h-full'>
          {/* Left Sidebar - Sessions */}
          <SessionSidebar />

          {/* Right Panel - Chat */}
          <div className='flex flex-1'>
            <ConnectionGuard>
              <ChatPanel />
            </ConnectionGuard>
          </div>
        </div>
      </Main>
    </>
  )
}
