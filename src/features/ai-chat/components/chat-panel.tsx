import { ChatInput } from './chat-input'
import { MessageList } from './message-list'

export function ChatPanel() {
  return (
    <div className='flex h-full flex-1 flex-col bg-background'>
      <MessageList />
      <ChatInput />
    </div>
  )
}
