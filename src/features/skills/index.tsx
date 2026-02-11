import { useState } from 'react'
import { AxiosError } from 'axios'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PermissionGuard } from '@/components/auth/permission-guard'
import { SkillCard } from './components/skill-card'
import { SkillDetailDialog } from './components/skill-detail-dialog'
import { InstallSkillDialog } from './components/install-skill-dialog'
import { UninstallSkillDialog } from './components/uninstall-skill-dialog'
import { DeleteSkillDialog } from './components/delete-skill-dialog'
import { CreateSkillDialog } from './components/create-skill-dialog'
import { useSkills, useMySkills, useDeleteSkill, useUpdateSkill, useActiveChatServers, useLoadSkill } from './hooks/use-skills'
import { skillsApi } from './api/skills.api'
import { type SkillTab, type Skill, type SessionSkill, type SkillFile, type LoadedServer, SkillStatus } from './types'

export function Skills() {
  const [activeTab, setActiveTab] = useState<SkillTab>('my-skills')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [relatedSessions, setRelatedSessions] = useState<SessionSkill[]>([])
  const [skillFiles, setSkillFiles] = useState<SkillFile[]>([])
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false)
  const [isUninstallDialogOpen, setIsUninstallDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [skillToInstall, setSkillToInstall] = useState<string | null>(null)
  const [skillToUninstall, setSkillToUninstall] = useState<Skill | null>(null)
  const [uninstallRelatedSessions, setUninstallRelatedSessions] = useState<SessionSkill[]>([])
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null)
  const [deleteLoadedServers, setDeleteLoadedServers] = useState<LoadedServer[]>([])
  const [deleteUnloadProgress, setDeleteUnloadProgress] = useState<{
    current: number
    total: number
    serverName: string
  } | null>(null)

  // 获取技能列表（根据 activeTab 决定调用哪个 API）
  const { data: platformSkills = [], isLoading: isPlatformLoading, error: platformError } = useSkills()
  const { data: mySkills = [], isLoading: isMySkillsLoading, error: mySkillsError } = useMySkills()

  // 根据当前 tab 选择对应的数据
  const skills = activeTab === 'my-skills' ? mySkills : platformSkills
  const isLoading = activeTab === 'my-skills' ? isMySkillsLoading : isPlatformLoading
  const error = activeTab === 'my-skills' ? mySkillsError : platformError

  // 删除技能
  const deleteSkillMutation = useDeleteSkill()

  // 更新技能状态
  const updateSkillMutation = useUpdateSkill()

  // 获取活跃的 ChatServer 列表
  const { data: chatServers = [], refetch: refetchActiveChatServers } = useActiveChatServers()

  // 装载技能
  const loadSkillMutation = useLoadSkill()

  const handleViewDetails = async (skillId: string) => {
    const skill = skills.find((s) => s.skillId === skillId)
    if (skill) {
      setSelectedSkill(skill)

      // 只在"我的技能" tab 中获取关联会话数据
      if (activeTab === 'my-skills') {
        try {
          const sessions = await skillsApi.getSkillRelatedSessions(skillId)
          setRelatedSessions(sessions)
        } catch (error) {
          console.error('获取关联会话失败:', error)
          setRelatedSessions([])
        }
      } else {
        // 平台技能不显示关联会话
        setRelatedSessions([])
      }

      // 获取技能文件列表
      try {
        const files = await skillsApi.getSkillFiles(skillId)
        setSkillFiles(files)
      } catch (error) {
        console.error('获取技能文件失败:', error)
        setSkillFiles([])
      }

      setIsDetailDialogOpen(true)
    }
  }

  const handleUninstall = async (skillId: string) => {
    const skill = skills.find((s) => s.skillId === skillId)
    if (skill) {
      setSkillToUninstall(skill)

      // 获取关联会话数据
      try {
        const sessions = await skillsApi.getSkillRelatedSessions(skillId)
        setUninstallRelatedSessions(sessions)
      } catch (error) {
        console.error('获取关联会话失败:', error)
        setUninstallRelatedSessions([])
      }

      setIsUninstallDialogOpen(true)
    }
  }

  const handleUninstallConfirm = async () => {
    if (!skillToUninstall) return

    try {
      await deleteSkillMutation.mutateAsync(skillToUninstall.skillId)
      setIsUninstallDialogOpen(false)
      setSkillToUninstall(null)
      setUninstallRelatedSessions([])
      toast.success('技能卸载成功')
    } catch (error) {
      toast.error(`卸载失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleUninstallDialogOpenChange = (open: boolean) => {
    if (!open) {
      // 关闭对话框时清空状态
      setSkillToUninstall(null)
      setUninstallRelatedSessions([])
    }
    setIsUninstallDialogOpen(open)
  }

  const handleDelete = async (skillId: string) => {
    const skill = skills.find((s) => s.skillId === skillId)
    if (!skill) return

    setSkillToDelete(skill)

    // 获取装载的服务器列表
    try {
      const servers = await skillsApi.getSkillLoadedServers(skillId)
      setDeleteLoadedServers(servers)

      // 打开删除确认对话框
      setIsDeleteDialogOpen(true)
    } catch (error) {
      console.error('获取装载服务器失败:', error)
      setDeleteLoadedServers([])
      setIsDeleteDialogOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!skillToDelete) return

    try {
      // 如果有装载的服务器，模拟卸载进度
      if (deleteLoadedServers.length > 0) {
        for (let i = 0; i < deleteLoadedServers.length; i++) {
          const server = deleteLoadedServers[i]
          setDeleteUnloadProgress({
            current: i + 1,
            total: deleteLoadedServers.length,
            serverName: server.chatServerName,
          })
          // 等待一小段时间以显示进度（实际卸载在后端进行）
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // 调用删除 API
      await deleteSkillMutation.mutateAsync(skillToDelete.skillId)

      setIsDeleteDialogOpen(false)
      setSkillToDelete(null)
      setDeleteLoadedServers([])
      setDeleteUnloadProgress(null)
      toast.success('技能删除成功')
    } catch (error) {
      setDeleteUnloadProgress(null)
      toast.error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open) {
      setSkillToDelete(null)
      setDeleteLoadedServers([])
      setDeleteUnloadProgress(null)
    }
    setIsDeleteDialogOpen(open)
  }

  const handleInstall = (skillId: string) => {
    void refetchActiveChatServers()
    setSkillToInstall(skillId)
    setIsInstallDialogOpen(true)
  }

  const handleInstallConfirm = async (chatServerId: string) => {
    if (!skillToInstall) return

    try {
      await loadSkillMutation.mutateAsync({
        skillId: skillToInstall,
        chatServerId,
      })
      toast.success('技能装载成功')
      setIsInstallDialogOpen(false)
      setSkillToInstall(null)
    } catch (error) {
      const backendMessage =
        error instanceof AxiosError
          ? (error.response?.data as { message?: string } | undefined)?.message
          : undefined

      const errorMessage = backendMessage || (error instanceof Error ? error.message : '未知错误')
      toast.error(`装载失败: ${errorMessage}`)
    }
  }

  const handleCreateSkill = () => {
    setIsCreateDialogOpen(true)
  }

  return (
    <>
      {/* Header - 顶部导航栏 */}
      <Header>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* Main - 主内容区域 */}
      <Main>
        <div className="flex h-full flex-col">
          {/* 顶部栏 */}
          <div className="border-b bg-background px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">技能管理</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  管理和配置你的 AI 技能
                </p>
              </div>
              <PermissionGuard permission="skill:create">
                <Button onClick={handleCreateSkill} className="gap-2">
                  <Plus className="h-4 w-4" />
                  创建技能
                </Button>
              </PermissionGuard>
            </div>

            {/* Tabs 切换 */}
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as SkillTab)}
              className="mt-6"
            >
              <TabsList>
                <TabsTrigger value="my-skills">我的技能</TabsTrigger>
                <TabsTrigger value="platform-skills">平台技能</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
            {/* 加载状态 */}
            {isLoading && (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* 错误状态 */}
            {error && (
              <div className="flex h-64 flex-col items-center justify-center gap-2">
                <p className="text-destructive">加载失败</p>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : '未知错误'}
                </p>
              </div>
            )}

            {/* 数据展示 */}
            {!isLoading && !error && (
              <Tabs value={activeTab}>
                <TabsContent value="my-skills" className="mt-0">
                  {skills.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-2">
                      <p className="text-muted-foreground">暂无技能</p>
                      <PermissionGuard permission="skill:create">
                        <Button onClick={handleCreateSkill} variant="outline" className="gap-2">
                          <Plus className="h-4 w-4" />
                          创建第一个技能
                        </Button>
                      </PermissionGuard>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                      {skills.map((skill) => (
                        <SkillCard
                          key={skill.id}
                          skill={skill}
                          onViewDetails={handleViewDetails}
                          onUninstall={handleUninstall}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="platform-skills" className="mt-0">
                  {skills.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-2">
                      <p className="text-muted-foreground">暂无平台技能</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                      {skills.map((skill) => (
                        <SkillCard
                          key={skill.id}
                          skill={skill}
                          mode="platform-skills"
                          onViewDetails={handleViewDetails}
                          onDelete={handleDelete}
                          onInstall={handleInstall}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
            </div>
          </div>
        </div>
      </Main>

      {/* 技能详情对话框 */}
      <SkillDetailDialog
        skill={selectedSkill}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        relatedSessions={relatedSessions}
        skillFiles={skillFiles}
      />

      {/* 装载技能对话框 */}
      <InstallSkillDialog
        open={isInstallDialogOpen}
        onOpenChange={setIsInstallDialogOpen}
        onConfirm={handleInstallConfirm}
        chatServers={chatServers}
        isLoading={loadSkillMutation.isPending}
      />

      {/* 卸载技能对话框 */}
      <UninstallSkillDialog
        open={isUninstallDialogOpen}
        onOpenChange={handleUninstallDialogOpenChange}
        onConfirm={handleUninstallConfirm}
        skillName={skillToUninstall?.name || ''}
        relatedSessions={uninstallRelatedSessions}
        isLoading={deleteSkillMutation.isPending}
      />

      {/* 删除技能对话框 */}
      <DeleteSkillDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirm={handleDeleteConfirm}
        skillName={skillToDelete?.name || ''}
        loadedServers={deleteLoadedServers}
        isLoading={deleteSkillMutation.isPending}
        unloadProgress={deleteUnloadProgress}
      />

      {/* 创建技能对话框 */}
      <CreateSkillDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  )
}
