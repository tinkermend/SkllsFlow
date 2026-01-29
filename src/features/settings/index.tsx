import { useNavigate, useLocation, Outlet } from '@tanstack/react-router'
import { Shield, Menu, Lock } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function Settings() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // 确定当前激活的 tab
  const getActiveTab = () => {
    if (pathname.includes('/settings/roles')) return 'roles'
    if (pathname.includes('/settings/permissions')) return 'permissions'
    return 'menus'
  }

  const handleTabChange = (value: string) => {
    const routes: Record<string, string> = {
      menus: '/settings/menus',
      roles: '/settings/roles',
      permissions: '/settings/permissions',
    }
    navigate({ to: routes[value] })
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>系统管理</h1>
            <p className='text-muted-foreground mt-2'>
              管理系统菜单、角色和权限配置
            </p>
          </div>

          <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value='menus'>
                <Menu className='me-2' size={16} />
                菜单管理
              </TabsTrigger>
              <TabsTrigger value='roles'>
                <Shield className='me-2' size={16} />
                角色管理
              </TabsTrigger>
              <TabsTrigger value='permissions'>
                <Lock className='me-2' size={16} />
                权限管理
              </TabsTrigger>
            </TabsList>

            <TabsContent value={getActiveTab()} className='mt-6'>
              <Outlet />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
