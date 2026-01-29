import { RolesProvider } from './components/roles-provider'
import { RolesPrimaryButtons } from './components/roles-primary-buttons'
import { RolesTable } from './components/roles-table'
import { RoleFormDialog } from './components/role-form-dialog'
import { RoleDeleteDialog } from './components/role-delete-dialog'

export function RolesPage() {
  return (
    <RolesProvider>
      <div className='p-6 space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-2xl font-bold'>角色管理</h1>
            <p className='text-muted-foreground text-sm mt-1'>
              管理系统角色和权限分配
            </p>
          </div>
          <RolesPrimaryButtons />
        </div>

        <RolesTable />
      </div>

      <RoleFormDialog />
      <RoleDeleteDialog />
    </RolesProvider>
  )
}
