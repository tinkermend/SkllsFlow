import { useState } from 'react'
import { format } from 'date-fns'
import { MoreHorizontal, Trash2, Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Session } from '../types'

interface SessionItemProps {
  session: Session
  isActive: boolean
  onClick: () => void
  onDelete: () => void
  onRename: (newTitle: string) => void
}

export function SessionItem({
  session,
  isActive,
  onClick,
  onDelete,
  onRename,
}: SessionItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(session.title || '新对话')

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== session.title) {
      onRename(editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(session.title || '新对话')
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
      <div className='min-w-0 flex-1 overflow-hidden'>
        {isEditing ? (
          <div className='flex items-center gap-1' onClick={(e) => e.stopPropagation()}>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
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
          <>
            <p className='truncate text-sm font-medium'>
              {session.title && session.title.length > 15
                ? session.title.slice(0, 15) + '...'
                : session.title || '新对话'}
            </p>
            <p className='truncate text-xs text-muted-foreground'>
              {session.time?.updated
                ? format(new Date(session.time.updated), 'MM-dd HH:mm')
                : ''}
            </p>
          </>
        )}
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
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
            >
              <Pencil className='mr-2 size-4' />
              重命名
            </DropdownMenuItem>
            <DropdownMenuItem
              className='text-destructive focus:text-destructive'
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className='mr-2 size-4' />
              删除会话
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      )}
    </div>
  )
}
