import { useState } from 'react'
import { Plus, Bot, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PermissionGuard } from '@/components/auth/permission-guard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChatServers } from '../hooks/use-chat-servers'

interface ServerSidebarProps {
  currentServerId?: string
  onServerSelect: (serverId: string) => void
}

export function ServerSidebar({ currentServerId, onServerSelect }: ServerSidebarProps) {
  const { chatServers, isLoading, createChatServer, deleteChatServer, isCreating } = useChatServers()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const handleCreateServer = () => {
    if (name.trim() && name.length <= 16) {
      createChatServer({ name: name.trim() })
      setName('')
      setOpen(false)
    }
  }

  const handleDeleteServer = (chatId: string) => {
    deleteChatServer(chatId)
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size='icon' variant='ghost'>
                <Plus className='size-4' />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加智能服务</DialogTitle>
              </DialogHeader>
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='name'>服务名称</Label>
                  <Input
                    id='name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={16}
                    placeholder='最长16个字符'
                  />
                </div>
                <Button onClick={handleCreateServer} disabled={isCreating || !name.trim()}>
                  {isCreating ? '创建中...' : '确认'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </PermissionGuard>
      </div>

      {/* 智能服务内容区 - 占据一半高度 */}
      <ScrollArea className='min-h-0 flex-1'>
        <div className='px-2 py-2'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <p className='text-sm text-muted-foreground'>加载中...</p>
            </div>
          ) : chatServers.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <Bot className='mb-2 size-8 text-muted-foreground/50' />
              <p className='text-sm text-muted-foreground'>暂无智能服务</p>
              <PermissionGuard permission='chatServer:create'>
                <Button variant='link' size='sm' onClick={() => setOpen(true)} className='mt-2'>
                  添加服务
                </Button>
              </PermissionGuard>
            </div>
          ) : (
            <div className='space-y-1'>
              {chatServers.map((server) => (
                <div
                  key={server.chatId}
                  className='flex items-center justify-between rounded-md p-3 hover:bg-accent'
                >
                  <div className='flex-1 cursor-pointer' onClick={() => onServerSelect(server.chatId)}>
                    <div className='font-medium'>{server.name}</div>
                    <div className='text-xs text-muted-foreground'>
                      {server.host}:{server.port}
                    </div>
                  </div>
                  <PermissionGuard permission='chatServer:delete'>
                    <Button
                      size='icon'
                      variant='ghost'
                      onClick={() => handleDeleteServer(server.chatId)}
                    >
                      <Trash2 className='size-4' />
                    </Button>
                  </PermissionGuard>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
