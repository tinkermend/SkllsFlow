import { RolesProvider } from './components/roles-provider'
import { RolesPrimaryButtons } from './components/roles-primary-buttons'
import { RolesTable } from './components/roles-table'
import { RoleFormDialog } from './components/role-form-dialog'
import { RoleDeleteDialog } from './components/role-delete-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function RolesPage() {
  return (
    <RolesProvider>
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <div>
              <CardTitle>角色列表</CardTitle>
              <CardDescription className='mt-1.5'>
                管理系统角色和权限分配
              </CardDescription>
            </div>
            <RolesPrimaryButtons />
          </div>
        </CardHeader>
        <CardContent>
          <RolesTable />
        </CardContent>
      </Card>

      <RoleFormDialog />
      <RoleDeleteDialog />
    </RolesProvider>
  )
}
