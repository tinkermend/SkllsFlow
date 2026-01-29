import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageHeader } from '@/components/layout/page-header'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { useUsers } from './hooks/use-users'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const page = search.page ?? 1
  const pageSize = search.pageSize ?? 10
  const usernameFilter = search.username || undefined

  // 使用真实 API 获取用户数据
  const { data, isLoading, isFetching, error } = useUsers({
    page,
    limit: pageSize,
    search: usernameFilter,
  })

  return (
    <UsersProvider>
      <Header fixed>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className='flex flex-1 flex-col gap-6'>
        <PageHeader
          title='用户管理'
          description='查看、筛选并维护系统用户、账号状态及关联角色。'
          actions={<UsersPrimaryButtons />}
        />

        {error ? (
          <Alert variant='destructive'>
            <AlertTitle>加载失败</AlertTitle>
            <AlertDescription>
              {(error as Error).message || '获取用户列表时出现问题，请稍后再试。'}
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardContent className='pt-6'>
              {isLoading ? (
                <UsersTableSkeleton />
              ) : (
                <UsersTable
                  data={data?.data || []}
                  search={search}
                  navigate={navigate}
                  pageCount={data?.totalPages ?? 0}
                  totalItems={data?.total ?? 0}
                  isFetching={isFetching}
                />
              )}
            </CardContent>
          </Card>
        )}
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}

function UsersTableSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-10 w-full max-w-md' />
      {[...Array(4)].map((_, index) => (
        <Skeleton key={index} className='h-12 w-full' />
      ))}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <Skeleton className='h-8 w-32' />
        <Skeleton className='h-8 w-48' />
      </div>
    </div>
  )
}
