import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableRowActions } from './data-table-row-actions';
import type { Menu } from '../data/schema';

export const menusColumns: ColumnDef<Menu>[] = [
  {
    accessorKey: 'name',
    header: '菜单名称',
    cell: ({ row }) => {
      const level = row.depth || 0;
      return (
        <div style={{ paddingLeft: `${level * 20}px` }}>
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
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
