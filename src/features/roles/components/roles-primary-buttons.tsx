import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/components/auth/permission-guard'
import { useRoles } from './roles-provider'

export function RolesPrimaryButtons() {
  const { setOpen } = useRoles()
  return (
    <PermissionGuard permission='role:create'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>创建角色</span> <Plus size={18} />
      </Button>
    </PermissionGuard>
  )
}
