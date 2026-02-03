import { useQuery } from '@tanstack/react-query'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import * as chatServerApi from '../api/chat-server.api'

interface DeleteServerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chatId: string
  serverName: string
  onConfirm: () => void
}

export function DeleteServerDialog({
  open,
  onOpenChange,
  chatId,
  serverName,
  onConfirm,
}: DeleteServerDialogProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['chat-server-delete-stats', chatId],
    queryFn: () => chatServerApi.getChatServerDeleteStats(chatId),
    enabled: open,
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除服务</AlertDialogTitle>
          <AlertDialogDescription className='space-y-3'>
            <p>
              您即将删除服务：<strong>{serverName}</strong>
            </p>

            {isLoading ? (
              <div className='flex items-center gap-2 text-sm'>
                <Loader2 className='size-4 animate-spin' />
                <span>正在加载关联数据...</span>
              </div>
            ) : stats ? (
              <div className='rounded-md bg-muted p-3 text-sm'>
                <p className='mb-2 font-medium'>将同时删除以下关联数据：</p>
                <ul className='space-y-1 text-muted-foreground'>
                  <li>• {stats.sessionsCount} 个会话记录</li>
                  <li>• {stats.agentsCount} 个 Agent 配置</li>
                  <li>• {stats.skillsCount} 个技能配置</li>
                  <li>• {stats.mcpsCount} 个 MCP 服务配置</li>
                </ul>
              </div>
            ) : null}

            <p className='font-medium text-destructive'>此操作不可恢复，请谨慎操作！</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className='bg-destructive hover:bg-destructive/90'
            disabled={isLoading}
          >
            确认删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
