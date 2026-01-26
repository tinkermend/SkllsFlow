import { cn } from '@/lib/utils'
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ui/reasoning'
import type { ToolInvocationPart, ToolResultPart } from '../types'

interface ToolReasoningProps {
  toolInvocation: ToolInvocationPart
  toolResult?: ToolResultPart
  isStreaming?: boolean
  className?: string
}

export function ToolReasoning({
  toolInvocation,
  toolResult,
  isStreaming,
  className,
}: ToolReasoningProps) {
  const formatToolArgs = (args: unknown): string => {
    if (typeof args === 'string') return args
    try {
      return JSON.stringify(args, null, 2)
    } catch {
      return String(args)
    }
  }

  const formatToolResult = (result: unknown): string => {
    if (typeof result === 'string') return result
    try {
      return JSON.stringify(result, null, 2)
    } catch {
      return String(result)
    }
  }

  return (
    <Reasoning isStreaming={isStreaming} className={cn('my-2', className)}>
      <ReasoningTrigger className='text-sm'>
        {isStreaming ? '正在调用' : '已调用'} {toolInvocation.toolName}
      </ReasoningTrigger>
      <ReasoningContent className='mt-2'>
        <div className='space-y-2 text-xs'>
          <div>
            <span className='font-medium text-foreground'>参数:</span>
            <pre className='mt-1 overflow-x-auto rounded bg-muted p-2'>
              {formatToolArgs(toolInvocation.args)}
            </pre>
          </div>
          {toolResult && (
            <div>
              <span className='font-medium text-foreground'>结果:</span>
              <pre className='mt-1 max-h-40 overflow-auto rounded bg-muted p-2'>
                {formatToolResult(toolResult.result)}
              </pre>
            </div>
          )}
        </div>
      </ReasoningContent>
    </Reasoning>
  )
}
