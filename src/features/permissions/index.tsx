import { SyncPermissionsButton } from './components/sync-permissions-button'
import { PermissionsTable } from './components/permissions-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function PermissionsPage() {
  return (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <div>
            <CardTitle>权限列表</CardTitle>
            <CardDescription className='mt-1.5'>
              查看和同步系统权限配置
            </CardDescription>
          </div>
          <SyncPermissionsButton />
        </div>
      </CardHeader>
      <CardContent>
        <PermissionsTable />
      </CardContent>
    </Card>
  )
}
