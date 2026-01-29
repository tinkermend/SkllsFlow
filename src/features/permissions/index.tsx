import { SyncPermissionsButton } from './components/sync-permissions-button'
import { PermissionsTable } from './components/permissions-table'

export function PermissionsPage() {
  return (
    <div className='p-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold'>权限管理</h1>
          <p className='text-muted-foreground text-sm mt-1'>
            查看和同步系统权限配置
          </p>
        </div>
        <SyncPermissionsButton />
      </div>

      <PermissionsTable />
    </div>
  )
}
