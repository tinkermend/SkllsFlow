import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table/data-table';
import { apiClient } from '@/lib/api-client';
import { menuListSchema, type Menu } from '../data/schema';
import { menusColumns, type MenuRow } from './menus-columns';

// 将树形数据扁平化，用于表格展示
function flattenMenus(menus: Menu[], level = 0): MenuRow[] {
  const result: MenuRow[] = [];

  for (const menu of menus) {
    result.push({ ...menu, depth: level });
    if (menu.children && menu.children.length > 0) {
      result.push(...flattenMenus(menu.children, level + 1));
    }
  }

  return result;
}

export function MenusTable() {
  const { data: menus = [], isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: async () => {
      const response = await apiClient.get('/menus');
      return menuListSchema.parse(response.data);
    },
  });

  const flatMenus = flattenMenus(menus);
  const filters = [
    {
      columnId: 'status',
      title: '状态',
      options: [
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'disabled' },
      ],
    },
    {
      columnId: 'type',
      title: '类型',
      options: [
        { label: '菜单', value: 'menu' },
        { label: '按钮', value: 'button' },
      ],
    },
    {
      columnId: 'isVisible',
      title: '显示',
      options: [
        { label: '可见', value: 'visible' },
        { label: '隐藏', value: 'hidden' },
      ],
    },
  ];

  return (
    <DataTable<MenuRow, MenuRow>
      columns={menusColumns}
      data={flatMenus}
      isLoading={isLoading}
      searchKey='name'
      searchPlaceholder='搜索菜单名称...'
      filters={filters}
    />
  );
}
