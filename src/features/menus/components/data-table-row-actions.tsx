import { type Row } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMenusContext } from './menus-provider';
import type { Menu } from '../data/schema';

interface DataTableRowActionsProps {
  row: Row<Menu>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setSelectedMenu, setIsFormOpen, setIsDeleteOpen } = useMenusContext();

  const handleEdit = () => {
    setSelectedMenu(row.original);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    setSelectedMenu(row.original);
    setIsDeleteOpen(true);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>打开菜单</span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className='mr-2 h-4 w-4' />
          编辑
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className='text-destructive'>
          <Trash2 className='mr-2 h-4 w-4' />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
