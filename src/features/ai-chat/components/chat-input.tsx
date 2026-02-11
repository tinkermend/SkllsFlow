/* eslint-disable no-console */
import { useState, useRef, useCallback } from 'react'
import { Send, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useChat } from '../hooks/use-chat'
import type { Command } from '../types'
import { CommandSuggestions } from './command-suggestions'

interface ChatInputProps {
  className?: string
}

export function ChatInput({ className }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { sendMessage, abortMessage, isStreaming, currentSessionId } = useChat()

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isStreaming || !currentSessionId) return

    const message = input.trim()
    setInput('')

    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      await sendMessage(message)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }, [input, isStreaming, currentSessionId, sendMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleCommandSelect = useCallback((command: Command) => {
    setInput(`/${command.name} `)
    textareaRef.current?.focus()
  }, [])

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value)

      // 自动调整高度
      const textarea = e.target
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    },
    []
  )

  const isDisabled = !currentSessionId

  return (
    <div className={cn('relative border-t bg-background p-4', className)}>
      {/* 移除 mx-auto max-w-3xl，使输入框靠左侧显示，与对话内容对齐 */}
      <div className='flex items-end gap-2'>
        <div className='relative flex-1'>
          {/* Command Suggestions */}
          <CommandSuggestions inputValue={input} onSelect={handleCommandSelect} />

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isDisabled
                ? '请先选择或创建一个对话'
                : isStreaming
                  ? 'AI 正在回复...'
                  : '输入消息... (Shift+Enter 换行)'
            }
            disabled={isDisabled || isStreaming}
            className='max-h-[200px] min-h-[44px] resize-none pr-12'
            rows={1}
          />
        </div>

        {isStreaming ? (
          <Button
            size='icon'
            variant='destructive'
            onClick={abortMessage}
            className='shrink-0'
          >
            <Square className='size-4' />
          </Button>
        ) : (
          <Button
            size='icon'
            onClick={handleSubmit}
            disabled={!input.trim() || isDisabled}
            className='shrink-0'
          >
            <Send className='size-4' />
          </Button>
        )}
      </div>

      <p className='mt-2 text-center text-xs text-muted-foreground'>
        AI 可能会出错，请核实重要信息
      </p>
    </div>
  )
}
