import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table/data-table';
import { apiClient } from '@/lib/api-client';
import { menuListSchema, type Menu } from '../data/schema';
import { menusColumns } from './menus-columns';

// 将树形数据扁平化，用于表格展示
function flattenMenus(menus: Menu[], level = 0): Menu[] {
  const result: Menu[] = [];

  for (const menu of menus) {
    result.push({ ...menu, depth: level } as Menu);
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

  return (
    <DataTable<Menu, Menu>
      columns={menusColumns}
      data={flatMenus}
      isLoading={isLoading}
      searchKey='name'
      searchPlaceholder='搜索菜单名称...'
    />
  );
}
