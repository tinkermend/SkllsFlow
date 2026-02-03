import { Plus, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { useChatStore } from '@/stores/chat-store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PermissionGuard } from '@/components/auth/permission-guard'
import {
  useSessions,
  useCreateSession,
  useDeleteSession,
  useUpdateSession,
  MAX_SESSIONS_PER_SERVICE,
} from '../hooks/use-sessions'
import { SessionItem } from './session-item'

export function ChatSessionList() {
  const { activeServer, currentSessionId, setCurrentSession } = useChatStore()
  const { data: sessions = [], isLoading } = useSessions()
  const createSession = useCreateSession()
  const deleteSession = useDeleteSession()
  const updateSession = useUpdateSession()

  const handleCreateSession = () => {
    if (!activeServer) return
    if (sessions.length >= MAX_SESSIONS_PER_SERVICE) {
      toast.error('每个服务最多 3 个会话')
      return
    }

    createSession.mutate({
      title: `对话 ${sessions.length + 1}`,
    })
  }

  const handleDeleteSession = (sessionId: string) => {
    if (!activeServer) return
    deleteSession.mutate(sessionId)
  }

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    if (!activeServer) return
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
        {activeServer && (
          <div className='flex items-center gap-2'>
            <PermissionGuard permission='session:create'>
              <Button
                size='icon'
                variant='ghost'
                onClick={handleCreateSession}
                disabled={createSession.isPending || sessions.length >= MAX_SESSIONS_PER_SERVICE}
              >
                <Plus className='size-4' />
              </Button>
            </PermissionGuard>
            {sessions.length >= MAX_SESSIONS_PER_SERVICE && (
              <span className='text-xs text-muted-foreground'>
                {sessions.length}/{MAX_SESSIONS_PER_SERVICE}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 对话列表内容区 */}
      <ScrollArea className='min-h-0 flex-1 px-2'>
        {!activeServer ? (
          <div className='flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground'>
            请选择一个智能服务以查看对话
          </div>
        ) : isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-sm text-muted-foreground'>加载中...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <MessageSquare className='mb-2 size-8 text-muted-foreground/50' />
            <p className='text-sm text-muted-foreground'>
              {activeServer.name} 暂无对话
            </p>
            {sessions.length < MAX_SESSIONS_PER_SERVICE && (
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
            )}
          </div>
        ) : (
          <div className='space-y-1 pb-4'>
            {sessions.map((session) => (
              <SessionItem
                key={session.sessionId}
                session={session}
                isActive={session.sessionId === currentSessionId}
                onClick={() => setCurrentSession(session.sessionId)}
                onDelete={() => handleDeleteSession(session.sessionId)}
                onRename={(newTitle) => handleRenameSession(session.sessionId, newTitle)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
