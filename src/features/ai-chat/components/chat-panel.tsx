import { ChatInput } from './chat-input'
import { MessageList } from './message-list'

export function ChatPanel() {
  return (
    <div className='flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background'>
      <MessageList />
      <ChatInput />
    </div>
  )
}
