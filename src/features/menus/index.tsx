import { MenusProvider } from './components/menus-provider';
import { MenusPrimaryButtons } from './components/menus-primary-buttons';
import { MenusTable } from './components/menus-table';
import { MenuFormDialog } from './components/menu-form-dialog';
import { MenuDeleteDialog } from './components/menu-delete-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function MenusPage() {
  return (
    <MenusProvider>
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <div>
              <CardTitle>菜单列表</CardTitle>
              <CardDescription className='mt-1.5'>
                管理系统菜单结构和权限分配
              </CardDescription>
            </div>
            <MenusPrimaryButtons />
          </div>
        </CardHeader>
        <CardContent>
          <MenusTable />
        </CardContent>
      </Card>

      <MenuFormDialog />
      <MenuDeleteDialog />
    </MenusProvider>
  );
}
