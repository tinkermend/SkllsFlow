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

  const activeTab = getActiveTab()

  const tabMeta: Record<
    string,
    {
      title: string
      description: string
    }
  > = {
    menus: {
      title: '菜单管理',
      description: '管理系统菜单结构和权限分配',
    },
    roles: {
      title: '角色管理',
      description: '配置系统角色及访问控制策略',
    },
    permissions: {
      title: '权限管理',
      description: '查看与同步系统权限定义，确保资源受控',
    },
  }

  const { title, description } = tabMeta[activeTab]

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
            <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
            <p className='text-muted-foreground mt-2'>{description}</p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
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

            <TabsContent value={activeTab} className='mt-6'>
              <Outlet />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
