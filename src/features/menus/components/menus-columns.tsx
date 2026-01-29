import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableRowActions } from './data-table-row-actions';
import type { Menu } from '../data/schema';

export type MenuRow = Menu & { depth?: number };

export const menusColumns: ColumnDef<MenuRow>[] = [
  {
    accessorKey: 'name',
    header: '菜单名称',
    cell: ({ row }) => {
      const level = row.original.depth ?? 0;
      return (
        <div style={{ paddingLeft: `${level * 20}px` }} className='flex items-center gap-2'>
          {row.original.name}
        </div>
      );
    },
  },
  {
    accessorKey: 'path',
    header: '路由路径',
    cell: ({ row }) => row.original.path || '-',
  },
  {
    accessorKey: 'icon',
    header: '图标',
    cell: ({ row }) => row.original.icon || '-',
  },
  {
    accessorKey: 'type',
    header: '类型',
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <Badge variant={type === 'menu' ? 'default' : 'secondary'}>
          {type === 'menu' ? '菜单' : '按钮'}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'isVisible',
    header: '显示',
    cell: ({ row }) => {
      const isVisible = row.original.isVisible;
      return (
        <Badge variant={isVisible ? 'default' : 'secondary'}>
          {isVisible ? '可见' : '隐藏'}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const state = row.original.isVisible ? 'visible' : 'hidden';
      return value.includes(state);
    },
  },
  {
    accessorKey: 'sort',
    header: '排序',
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
          {status === 'active' ? '启用' : '禁用'}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
