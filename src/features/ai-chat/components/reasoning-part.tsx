import { cn } from '@/lib/utils'
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ui/reasoning'
import type { ReasoningPart } from '../types'
import { Brain } from 'lucide-react'

interface ReasoningPartComponentProps {
  reasoning: ReasoningPart
  isStreaming?: boolean
  className?: string
}

export function ReasoningPartComponent({
  reasoning,
  isStreaming,
  className,
}: ReasoningPartComponentProps) {
  // 计算思考时长
  const duration = reasoning.time.end
    ? Math.round((reasoning.time.end - reasoning.time.start) / 1000)
    : null

  return (
    <div className={cn('rounded-lg border border-border bg-muted/30 p-3', className)}>
      <Reasoning isStreaming={isStreaming}>
        <ReasoningTrigger className='text-sm'>
          <div className='flex items-center gap-2'>
            <Brain className='size-4' />
            <span className='font-medium'>
              {isStreaming ? '思考中' : '思考过程'}
            </span>
            {duration !== null && (
              <span className='text-muted-foreground'>· {duration}秒</span>
            )}
          </div>
        </ReasoningTrigger>
        <ReasoningContent markdown={true} className='mt-3'>
          {reasoning.text}
        </ReasoningContent>
      </Reasoning>
    </div>
  )
}
