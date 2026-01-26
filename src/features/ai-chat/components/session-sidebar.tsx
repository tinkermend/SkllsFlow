import { useState } from 'react'
import { Plus, MessageSquare, Search } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useSessions,
  useCreateSession,
  useDeleteSession,
  useUpdateSession,
} from '../hooks/use-sessions'
import { SessionItem } from './session-item'

export function SessionSidebar() {
  const [search, setSearch] = useState('')
  const { currentSessionId, setCurrentSession } = useChatStore()
  const { data: sessions = [], isLoading } = useSessions()
  const createSession = useCreateSession()
  const deleteSession = useDeleteSession()
  const updateSession = useUpdateSession()

  // 搜索过滤
  const filteredSessions = sessions
    .filter((session) =>
      session.title?.toLowerCase().includes(search.toLowerCase())
    )

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
    <div className='flex h-full w-64 flex-col border-r bg-card'>
      {/* Header */}
      <div className='flex items-center justify-between border-b p-4'>
        <div className='flex items-center gap-2'>
          <MessageSquare className='size-5 text-primary' />
          <h2 className='font-semibold'>对话列表</h2>
        </div>
        <Button
          size='icon'
          variant='ghost'
          onClick={handleCreateSession}
          disabled={createSession.isPending}
        >
          <Plus className='size-4' />
        </Button>
      </div>

      {/* Search */}
      <div className='p-3'>
        <div className='relative'>
          <Search className='absolute top-2.5 left-2.5 size-4 text-muted-foreground' />
          <Input
            placeholder='搜索会话...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-8'
          />
        </div>
      </div>

      {/* Session List */}
      <ScrollArea className='min-h-0 flex-1 px-2'>
        {isLoading ? (
          <div className='flex items-center justify-center py-8'>
            <p className='text-sm text-muted-foreground'>加载中...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <MessageSquare className='mb-2 size-8 text-muted-foreground/50' />
            <p className='text-sm text-muted-foreground'>
              {search ? '没有找到匹配的会话' : '暂无对话'}
            </p>
            {!search && (
              <Button
                variant='link'
                size='sm'
                onClick={handleCreateSession}
                className='mt-2'
              >
                创建新对话
              </Button>
            )}
          </div>
        ) : (
          <div className='space-y-1 pb-4'>
            {filteredSessions.map((session) => (
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

      {/* New Chat Button - 固定在底部 */}
      <div className='shrink-0 border-t p-3'>
        <Button
          className='w-full'
          onClick={handleCreateSession}
          disabled={createSession.isPending}
        >
          <Plus className='mr-2 size-4' />
          新建对话
        </Button>
      </div>
    </div>
  )
}
