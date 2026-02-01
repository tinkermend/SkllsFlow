import { Plus, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PermissionGuard } from '@/components/auth/permission-guard'
import { ServerItem } from './server-item'

// TODO: 后续需要创建 use-chat-servers hook
interface ChatServer {
  id: string
  name: string
  description?: string
  status?: 'connected' | 'disconnected' | 'connecting'
}

interface ServerSidebarProps {
  currentServerId?: string
  onServerSelect: (serverId: string) => void
}

export function ServerSidebar({ currentServerId, onServerSelect }: ServerSidebarProps) {
  // TODO: 替换为真实的 API 调用
  const servers: ChatServer[] = []
  const isLoading = false

  const handleCreateServer = () => {
    // TODO: 实现创建服务逻辑
    console.log('创建新服务')
  }

  const handleDeleteServer = (serverId: string) => {
    // TODO: 实现删除服务逻辑
    console.log('删除服务:', serverId)
  }

  const handleRenameServer = (serverId: string, newName: string) => {
    // TODO: 实现重命名服务逻辑
    console.log('重命名服务:', serverId, newName)
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {/* 智能服务标题栏 */}
      <div className='flex items-center justify-between border-b p-4'>
        <div className='flex items-center gap-2'>
          <Bot className='size-5 text-primary' />
          <h2 className='font-semibold'>智能服务</h2>
        </div>
        <PermissionGuard permission='chatServer:create'>
          <Button size='icon' variant='ghost' onClick={handleCreateServer}>
            <Plus className='size-4' />
          </Button>
        </PermissionGuard>
      </div>

      {/* 智能服务内容区 - 占据一半高度 */}
      <ScrollArea className='min-h-0 flex-1'>
        <div className='px-2 py-2'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <p className='text-sm text-muted-foreground'>加载中...</p>
            </div>
          ) : servers.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <Bot className='mb-2 size-8 text-muted-foreground/50' />
              <p className='text-sm text-muted-foreground'>暂无智能服务</p>
              <PermissionGuard permission='chatServer:create'>
                <Button variant='link' size='sm' onClick={handleCreateServer} className='mt-2'>
                  添加服务
                </Button>
              </PermissionGuard>
            </div>
          ) : (
            <div className='space-y-1'>
              {servers.map((server) => (
                <ServerItem
                  key={server.id}
                  server={server}
                  isActive={server.id === currentServerId}
                  onClick={() => onServerSelect(server.id)}
                  onDelete={() => handleDeleteServer(server.id)}
                  onRename={(newName) => handleRenameServer(server.id, newName)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
