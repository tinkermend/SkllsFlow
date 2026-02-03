import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/stores/chat-store'

interface ConnectionGuardProps {
  children: React.ReactNode
}

export function ConnectionGuard({ children }: ConnectionGuardProps) {
  const { connectionStatus, activeServer, requestReconnect } = useChatStore()

  if (!activeServer) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground'>
        <p>请先在左侧选择一个智能服务</p>
        <p>选择后将自动加载对应的对话列表与连接</p>
      </div>
    )
  }

  if (connectionStatus === 'connecting') {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4'>
        <Loader2 className='size-8 animate-spin text-primary' />
        <p className='text-muted-foreground'>正在连接 {activeServer.name}...</p>
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
            无法连接到 {activeServer.name}，请检查服务状态或稍后重试
          </p>
        </div>
        <Button variant='outline' onClick={() => requestReconnect()}>
          <RefreshCw className='mr-2 size-4' />
          重试连接
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
