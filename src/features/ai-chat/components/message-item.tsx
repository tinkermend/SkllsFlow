import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Markdown } from '@/components/ui/markdown'
import { FEATURE_FLAGS } from '../config/feature-flags'
import type { Message, ToolInvocationPart, ToolResultPart, ReasoningPart } from '../types'
import { ToolReasoning } from './tool-reasoning'
import { ReasoningPartComponent } from './reasoning-part'

interface MessageItemProps {
  message: Message
  isStreaming?: boolean
  className?: string
}

export function MessageItem({
  message,
  isStreaming,
  className,
}: MessageItemProps) {
  const isUser = message.info.role === 'user'

  // 提取文本内容
  const textContent = message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string }).text)
    .join('\n')

  // 提取工具调用
  const toolInvocations = message.parts.filter(
    (part) => part.type === 'tool-invocation'
  ) as ToolInvocationPart[]

  // 提取工具结果
  const toolResults = message.parts.filter(
    (part) => part.type === 'tool-result'
  ) as ToolResultPart[]

  // 提取推理部分
  const reasoningParts = message.parts.filter(
    (part) => part.type === 'reasoning'
  ) as ReasoningPart[]

  // 匹配工具调用和结果
  const getToolResult = (toolCallId: string) =>
    toolResults.find((r) => r.toolCallId === toolCallId)

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {/* Avatar */}
      <Avatar className='size-8 shrink-0'>
        <AvatarFallback
          className={cn(
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
        >
          {isUser ? <User className='size-4' /> : <Bot className='size-4' />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div
        className={cn(
          'max-w-[80%] space-y-2',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Reasoning Parts */}
        {!isUser &&
          reasoningParts.map((reasoning) => (
            <ReasoningPartComponent
              key={reasoning.id}
              reasoning={reasoning}
              isStreaming={isStreaming && !reasoning.time.end}
            />
          ))}

        {/* Tool Invocations */}
        {FEATURE_FLAGS.showToolInvocations &&
          !isUser &&
          toolInvocations.map((tool) => (
            <ToolReasoning
              key={tool.id}
              toolInvocation={tool}
              toolResult={getToolResult(tool.id)}
              isStreaming={isStreaming && !getToolResult(tool.id)}
            />
          ))}

        {/* Text Content */}
        {textContent && (
          <div
            className={cn(
              'rounded-2xl px-4 py-2',
              isUser
                ? 'rounded-br-sm bg-primary text-primary-foreground'
                : 'rounded-bl-sm bg-muted'
            )}
          >
            {isUser ? (
              <p className='text-sm whitespace-pre-wrap'>{textContent}</p>
            ) : (
              <div className='prose prose-sm dark:prose-invert max-w-none'>
                <Markdown>{textContent}</Markdown>
              </div>
            )}
          </div>
        )}

        {/* Streaming Indicator - 等待 AI 响应 */}
        {isStreaming &&
          !textContent &&
          toolInvocations.length === 0 &&
          reasoningParts.length === 0 && (
            <div className='flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3'>
              <div className='flex items-center gap-1'>
                <span className='size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]' />
                <span className='size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]' />
                <span className='size-2 animate-bounce rounded-full bg-primary' />
              </div>
              <span className='text-sm text-muted-foreground'>AI 正在准备回复...</span>
            </div>
          )}
      </div>
    </div>
  )
}
