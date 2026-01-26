import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useChatStore } from '@/stores/chat-store'
import { Button } from '@/components/ui/button'
import { useOpenCodeInit } from '../hooks/use-opencode-init'

interface ConnectionGuardProps {
  children: React.ReactNode
}

export function ConnectionGuard({ children }: ConnectionGuardProps) {
  const { connectionStatus } = useChatStore()
  const { reconnect } = useOpenCodeInit()

  if (connectionStatus === 'connecting') {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4'>
        <Loader2 className='size-8 animate-spin text-primary' />
        <p className='text-muted-foreground'>正在连接 AI 服务...</p>
      </div>
    )
  }

  if (connectionStatus === 'error') {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4'>
        <AlertCircle className='size-12 text-destructive' />
        <div className='text-center'>
          <p className='text-lg font-medium'>连接失败</p>
          <p className='text-sm text-muted-foreground'>
            无法连接到 AI 服务，请检查网络或稍后重试
          </p>
        </div>
        <Button onClick={() => reconnect()} variant='outline'>
          <RefreshCw className='mr-2 size-4' />
          重新连接
        </Button>
      </div>
    )
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4'>
        <div className='text-center'>
          <p className='text-lg font-medium'>未连接</p>
          <p className='text-sm text-muted-foreground'>
            请先登录以使用 AI 对话功能
          </p>
        </div>
        <Button onClick={() => reconnect()} variant='default'>
          连接服务
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
