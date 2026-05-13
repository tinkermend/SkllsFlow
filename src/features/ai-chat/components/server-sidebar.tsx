import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Plus, Bot, Trash2, Power, PowerOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PermissionGuard } from '@/components/auth/permission-guard'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ChatServer } from '../types'
import { useChatServers } from '../hooks/use-chat-servers'
import { DeleteServerDialog } from './delete-server-dialog'

export type HealthStatus = NonNullable<ChatServer['healthStatus']>

const HEALTH_INDICATORS: Record<HealthStatus, { label: string; className: string }> = {
  healthy: { label: '运行正常', className: 'bg-green-500 ring-green-500/70' },
  unhealthy: { label: '运行异常', className: 'bg-red-500 ring-red-500/70' },
  unknown: { label: '状态未知', className: 'bg-stone-400 ring-stone-400/60' },
}

export const formatDateTime = (value?: string): string => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }
  return format(date, 'yyyy-MM-dd HH:mm')
}

export const buildHealthTooltip = (server: ChatServer): string => {
  const status: HealthStatus = server.healthStatus ?? 'unknown'
  const base = HEALTH_INDICATORS[status].label
  const parts = [base]
  if (server.healthVersion) {
    parts.push(`版本 ${server.healthVersion}`)
  }
  if (server.healthCheckedAt) {
    const checkedAt = new Date(server.healthCheckedAt)
    if (!Number.isNaN(checkedAt.getTime())) {
      parts.push(format(checkedAt, 'HH:mm:ss'))
    }
  }
  return parts.join(' · ')
}

interface ServerSidebarProps {
  activeServerId?: string
  onServerSelect: (server: ChatServer | null) => void
}

export function ServerSidebar({ activeServerId, onServerSelect }: ServerSidebarProps) {
  const {
    chatServers,
    isLoading,
    createChatServer,
    deleteChatServer,
    setChatServerStatus,
    isCreating,
    togglingChatId,
  } = useChatServers()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [serverToDelete, setServerToDelete] = useState<{ chatId: string; name: string } | null>(null)

  const handleCreateServer = () => {
    if (name.trim() && name.length <= 16) {
      createChatServer({ name: name.trim() })
      setName('')
      setOpen(false)
    }
  }

  const handleDeleteClick = (chatId: string, serverName: string) => {
    setServerToDelete({ chatId, name: serverName })
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (serverToDelete) {
      deleteChatServer(serverToDelete.chatId)
      setDeleteDialogOpen(false)
      setServerToDelete(null)
    }
  }

  const sortedChatServers = useMemo(
    () =>
      [...chatServers].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }),
    [chatServers]
  )

  useEffect(() => {
    if (!activeServerId) return
    const stillExists = sortedChatServers.some((server) => server.chatId === activeServerId)
    if (!stillExists) {
      onServerSelect(null)
    }
  }, [activeServerId, onServerSelect, sortedChatServers])

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {/* 智能服务标题栏 */}
      <div className='flex items-center justify-between border-b p-4'>
        <div className='flex items-center gap-2'>
          <Bot className='size-5 text-primary' />
          <h2 className='font-semibold'>智能服务</h2>
        </div>
        <PermissionGuard permission='chatServer:create'>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size='icon' variant='ghost'>
                <Plus className='size-4' />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加智能服务</DialogTitle>
              </DialogHeader>
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='name'>服务名称</Label>
                  <Input
                    id='name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={16}
                    placeholder='最长16个字符'
                  />
                </div>
                <Button onClick={handleCreateServer} disabled={isCreating || !name.trim()}>
                  {isCreating ? '创建中...' : '确认'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </PermissionGuard>
      </div>

      {/* 智能服务内容区 - 占据一半高度 */}
      <ScrollArea className='min-h-0 flex-1'>
        <div className='px-2 py-2'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <p className='text-sm text-muted-foreground'>加载中...</p>
            </div>
          ) : sortedChatServers.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <Bot className='mb-2 size-8 text-muted-foreground/50' />
              <p className='text-sm text-muted-foreground'>暂无智能服务</p>
              <PermissionGuard permission='chatServer:create'>
                <Button variant='link' size='sm' onClick={() => setOpen(true)} className='mt-2'>
                  添加服务
                </Button>
              </PermissionGuard>
            </div>
          ) : (
            <div className='space-y-1'>
              {sortedChatServers.map((server) => {
                const status: HealthStatus = server.healthStatus ?? 'unknown'
                const indicator = HEALTH_INDICATORS[status]
                const tooltipText = buildHealthTooltip(server)
                const isActive = server.chatId === activeServerId
                const isOnline = server.status === 'active'
                const isToggling = togglingChatId === server.chatId
                const toggleAction: 'activate' | 'deactivate' = isOnline
                  ? 'deactivate'
                  : 'activate'
                const toggleLabel = isOnline ? '离线服务' : '激活服务'
                const ToggleIcon = isOnline ? Power : PowerOff
                const selectable = isOnline && !isToggling

                return (
                  <div
                    key={server.chatId}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3 transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/30 shadow-sm'
                        : selectable
                          ? 'opacity-60 hover:opacity-100 hover:bg-accent'
                          : 'opacity-50',
                      server.status === 'error' && 'border-destructive/40'
                    )}
                    role='button'
                    tabIndex={0}
                    aria-pressed={isActive}
                    onClick={() => {
                      if (isActive) return
                      if (!selectable) {
                        toast.error('服务未激活，请先点击右侧按钮激活')
                        return
                      }
                      onServerSelect(server)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        if (isActive) return
                        if (!selectable) {
                          toast.error('服务未激活，请先点击右侧按钮激活')
                          return
                        }
                        onServerSelect(server)
                      }
                    }}
                  >
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 font-medium'>
                        <span>{server.name}</span>
                        {isActive && (
                          <Badge variant='secondary' className='text-[11px]'>
                            当前激活
                          </Badge>
                        )}
                        {server.status === 'disabled' && (
                          <Badge variant='outline' className='text-[11px]'>
                            已离线
                          </Badge>
                        )}
                        {server.status === 'error' && (
                          <Badge variant='destructive' className='text-[11px]'>
                            异常
                          </Badge>
                        )}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        创建于 {formatDateTime(server.createdAt)}
                      </div>
                      {server.status === 'error' && server.errorMessage && (
                        <div className='mt-1 line-clamp-2 text-xs text-destructive'>
                          {server.errorMessage}
                        </div>
                      )}
                    </div>
                    <div className='flex items-center gap-1'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              'inline-block size-2.5 rounded-full ring-1 ring-offset-1 ring-offset-background',
                              indicator.className
                            )}
                            aria-label={indicator.label}
                            role='status'
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className='text-xs leading-tight'>{tooltipText}</p>
                        </TooltipContent>
                      </Tooltip>
                      <PermissionGuard permission='chatServer:update'>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size='icon'
                              variant='ghost'
                              disabled={isToggling}
                              aria-label={toggleLabel}
                              onClick={(event) => {
                                event.stopPropagation()
                                setChatServerStatus(server.chatId, toggleAction)
                              }}
                            >
                              {isToggling ? (
                                <Loader2 className='size-4 animate-spin' />
                              ) : (
                                <ToggleIcon
                                  className={cn(
                                    'size-4',
                                    isOnline ? 'text-foreground' : 'text-primary'
                                  )}
                                />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className='text-xs leading-tight'>{toggleLabel}</p>
                          </TooltipContent>
                        </Tooltip>
                      </PermissionGuard>
                      <PermissionGuard permission='chatServer:delete'>
                        <Button
                          size='icon'
                          variant='ghost'
                          onClick={(event) => {
                            event.stopPropagation()
                            handleDeleteClick(server.chatId, server.name)
                          }}
                        >
                          <Trash2 className='size-4' />
                        </Button>
                      </PermissionGuard>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 删除确认对话框 */}
      {serverToDelete && (
        <DeleteServerDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          chatId={serverToDelete.chatId}
          serverName={serverToDelete.name}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
