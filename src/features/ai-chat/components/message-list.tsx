import { useChatStore } from '@/stores/chat-store'
import {
  ChatContainerRoot,
  ChatContainerContent,
} from '@/components/ui/chat-container'
import { MessageItem } from './message-item'

export function MessageList() {
  const { currentSessionId, messagesBySession, streamingMessageId } =
    useChatStore()

  const messages = currentSessionId
    ? messagesBySession[currentSessionId] || []
    : []

  if (!currentSessionId) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='text-muted-foreground'>选择或创建一个对话开始</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4'>
        <div className='rounded-full bg-primary/10 p-4'>
          <svg
            className='size-8 text-primary'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z'
            />
          </svg>
        </div>
        <div className='text-center'>
          <p className='text-lg font-medium'>开始对话</p>
          <p className='text-sm text-muted-foreground'>
            输入消息与 AI 助手交流
          </p>
        </div>
      </div>
    )
  }

  return (
    <ChatContainerRoot className='flex-1 overflow-y-auto p-4'>
      {/* 移除 mx-auto max-w-3xl，使对话内容靠左侧显示，与菜单栏贴合 */}
      <ChatContainerContent className='space-y-4'>
        {messages.map((message) => (
          <MessageItem
            key={message.info.id}
            message={message}
            isStreaming={message.info.id === streamingMessageId}
          />
        ))}
      </ChatContainerContent>
    </ChatContainerRoot>
  )
}
