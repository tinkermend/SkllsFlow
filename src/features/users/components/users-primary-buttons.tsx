import { MailPlus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/components/auth/permission-guard'
import { useUsers } from './users-provider'

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers()
  return (
    <div className='flex gap-2'>
      <PermissionGuard permission='user:create'>
        <Button
          variant='outline'
          className='space-x-1'
          onClick={() => setOpen('invite')}
        >
          <span>邀请用户</span> <MailPlus size={18} />
        </Button>
      </PermissionGuard>
      <PermissionGuard permission='user:create'>
        <Button className='space-x-1' onClick={() => setOpen('add')}>
          <span>添加用户</span> <UserPlus size={18} />
        </Button>
      </PermissionGuard>
    </div>
  )
}
