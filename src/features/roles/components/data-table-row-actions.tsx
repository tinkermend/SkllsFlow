import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/auth-store'
import { type Role } from '../data/schema'
import { useRoles } from './roles-provider'

type DataTableRowActionsProps = {
  row: Row<Role>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRole } = useRoles()
  const { auth } = useAuthStore()

  // 检查权限
  const canUpdate = auth.user?.permissions?.includes('role:update') ?? false
  const canDelete = auth.user?.permissions?.includes('role:delete') ?? false

  // 如果没有任何操作权限，不显示操作按钮
  if (!canUpdate && !canDelete) {
    return null
  }

  // 系统内置角色不允许删除
  const isSystemRole = row.original.isSystem

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>打开菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        {canUpdate && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRole(row.original)
              setOpen('edit')
            }}
          >
            编辑
            <DropdownMenuShortcut>
              <Pencil size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        {canUpdate && canDelete && !isSystemRole && <DropdownMenuSeparator />}
        {canDelete && !isSystemRole && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRole(row.original)
              setOpen('delete')
            }}
            className='text-red-500!'
          >
            删除
            <DropdownMenuShortcut>
              <Trash2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
