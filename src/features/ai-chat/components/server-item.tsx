import { useState } from 'react'
import { MoreHorizontal, Trash2, Pencil, Check, X, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePermission } from '@/hooks/use-permission'

interface ChatServer {
  id: string
  name: string
  description?: string
  status?: 'connected' | 'disconnected' | 'connecting'
}

interface ServerItemProps {
  server: ChatServer
  isActive: boolean
  onClick: () => void
  onDelete: () => void
  onRename: (newName: string) => void
}

export function ServerItem({
  server,
  isActive,
  onClick,
  onDelete,
  onRename,
}: ServerItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(server.name || '新服务')
  const { can } = usePermission()

  const handleRename = () => {
    if (editName.trim() && editName !== server.name) {
      onRename(editName.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditName(server.name || '新服务')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div
      className={cn(
        'group/item flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors',
        isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
      )}
      onClick={isEditing ? undefined : onClick}
    >
      <div className='flex min-w-0 flex-1 items-center gap-2 overflow-hidden'>
        <Bot className='size-4 shrink-0' />
        <div className='min-w-0 flex-1'>
          {isEditing ? (
            <div className='flex items-center gap-1' onClick={(e) => e.stopPropagation()}>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                className='h-7 text-sm'
                autoFocus
                onFocus={(e) => e.target.select()}
              />
              <Button
                size='icon'
                variant='ghost'
                className='size-7 shrink-0'
                onClick={handleRename}
              >
                <Check className='size-3' />
              </Button>
              <Button
                size='icon'
                variant='ghost'
                className='size-7 shrink-0'
                onClick={handleCancel}
              >
                <X className='size-3' />
              </Button>
            </div>
          ) : (
            <p className='truncate text-sm font-medium'>
              {server.name && server.name.length > 15
                ? server.name.slice(0, 15) + '...'
                : server.name || '新服务'}
            </p>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className='relative shrink-0'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='size-8 group-hover/item:opacity-100 md:opacity-0 md:transition-opacity'
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {can('update', 'ChatServer') && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditing(true)
                  }}
                >
                  <Pencil className='mr-2 size-4' />
                  重命名
                </DropdownMenuItem>
              )}
              {can('delete', 'ChatServer') && (
                <DropdownMenuItem
                  className='text-destructive focus:text-destructive'
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                >
                  <Trash2 className='mr-2 size-4' />
                  删除服务
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
