import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Role } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const rolesColumns: ColumnDef<Role>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='全选'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='选择行'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='角色名称' />
    ),
    cell: ({ row }) => (
      <div className='font-medium'>{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='角色代码' />
    ),
    cell: ({ row }) => (
      <code className='text-sm bg-muted px-2 py-1 rounded'>
        {row.getValue('code')}
      </code>
    ),
  },
  {
    accessorKey: 'description',
    header: '描述',
    cell: ({ row }) => {
      const description = row.getValue('description') as string | null
      return (
        <div className='max-w-[300px] truncate text-muted-foreground'>
          {description || '-'}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
          {status === 'active' ? '启用' : '禁用'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'isSystem',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='角色类型' />
    ),
    cell: ({ row }) => {
      const isSystem = row.getValue('isSystem') as boolean
      return (
        <Badge variant={isSystem ? 'secondary' : 'outline'}>
          {isSystem ? '系统内置' : '自定义'}
        </Badge>
      )
    },
    enableSorting: false,
    filterFn: (row, id, value) => {
      const type = (row.getValue(id) as boolean) ? 'system' : 'custom'
      return value.includes(type)
    },
  },
  {
    id: 'permissions',
    header: '权限数量',
    cell: ({ row }) => {
      const { rolePermissions } = row.original
      return (
        <div className='text-center'>
          <Badge variant='outline'>{rolePermissions.length}</Badge>
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
