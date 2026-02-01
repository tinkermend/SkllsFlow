import { Plus, MessageSquare } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PermissionGuard } from '@/components/auth/permission-guard'
import {
  useSessions,
  useCreateSession,
  useDeleteSession,
  useUpdateSession,
} from '../hooks/use-sessions'
import { SessionItem } from './session-item'

export function ChatSessionList() {
  const { currentSessionId, setCurrentSession } = useChatStore()
  const { data: sessions = [], isLoading } = useSessions()
  const createSession = useCreateSession()
  const deleteSession = useDeleteSession()
  const updateSession = useUpdateSession()

  const handleCreateSession = () => {
    createSession.mutate({
      title: `对话 ${sessions.length + 1}`,
    })
  }

  const handleDeleteSession = (sessionId: string) => {
    deleteSession.mutate(sessionId)
  }

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    updateSession.mutate({ sessionId, title: newTitle })
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {/* 对话列表标题栏 */}
      <div className='flex items-center justify-between border-b p-4'>
        <div className='flex items-center gap-2'>
          <MessageSquare className='size-5 text-primary' />
          <h2 className='font-semibold'>对话列表</h2>
        </div>
        <PermissionGuard permission='session:create'>
          <Button
            size='icon'
            variant='ghost'
            onClick={handleCreateSession}
            disabled={createSession.isPending}
          >
            <Plus className='size-4' />
          </Button>
        </PermissionGuard>
      </div>

      {/* 对话列表内容区 */}
      <ScrollArea className='min-h-0 flex-1 px-2'>
        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-sm text-muted-foreground'>加载中...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <MessageSquare className='mb-2 size-8 text-muted-foreground/50' />
            <p className='text-sm text-muted-foreground'>暂无对话</p>
            <PermissionGuard permission='session:create'>
              <Button
                variant='link'
                size='sm'
                onClick={handleCreateSession}
                className='mt-2'
              >
                创建新对话
              </Button>
            </PermissionGuard>
          </div>
        ) : (
          <div className='space-y-1 pb-4'>
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={session.id === currentSessionId}
                onClick={() => setCurrentSession(session.id)}
                onDelete={() => handleDeleteSession(session.id)}
                onRename={(newTitle) => handleRenameSession(session.id, newTitle)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
