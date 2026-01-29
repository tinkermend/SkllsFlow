import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PermissionGuard } from '@/components/auth/permission-guard'
import { SkillCard } from './components/skill-card'
import { SkillDetailDialog } from './components/skill-detail-dialog'
import { InstallSkillDialog } from './components/install-skill-dialog'
import { UninstallSkillDialog } from './components/uninstall-skill-dialog'
import { DisableSkillDialog } from './components/disable-skill-dialog'
import { DeleteSkillDialog } from './components/delete-skill-dialog'
import { CreateSkillDialog } from './components/create-skill-dialog'
import { useSkills, useDeleteSkill, useUpdateSkill } from './hooks/use-skills'
import { skillsApi } from './api/skills.api'
import { type SkillTab, type Skill, type SessionSkill, SkillStatus } from './types'

export function Skills() {
  const [activeTab, setActiveTab] = useState<SkillTab>('my-skills')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [relatedSessions, setRelatedSessions] = useState<SessionSkill[]>([])
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false)
  const [isUninstallDialogOpen, setIsUninstallDialogOpen] = useState(false)
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [skillToInstall, setSkillToInstall] = useState<string | null>(null)
  const [skillToUninstall, setSkillToUninstall] = useState<Skill | null>(null)
  const [uninstallRelatedSessions, setUninstallRelatedSessions] = useState<SessionSkill[]>([])
  const [skillToDisable, setSkillToDisable] = useState<Skill | null>(null)
  const [disableRelatedSessions, setDisableRelatedSessions] = useState<SessionSkill[]>([])
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null)
  const [deleteRelatedSessions, setDeleteRelatedSessions] = useState<SessionSkill[]>([])

  // 获取技能列表
  const { data: skills = [], isLoading, error } = useSkills()

  // 删除技能
  const deleteSkillMutation = useDeleteSkill()

  // 更新技能状态
  const updateSkillMutation = useUpdateSkill()

  // Mock 会话数据（后续替换为真实 API）
  const mockSessions = [
    { id: 'session-1', name: '会话 1 - 代码分析' },
    { id: 'session-2', name: '会话 2 - 数据处理' },
    { id: 'session-3', name: '会话 3 - 文档生成' },
  ]

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

    // 获取关联会话数据
    try {
      const sessions = await skillsApi.getSkillRelatedSessions(skillId)
      setDeleteRelatedSessions(sessions)

      // 打开删除确认对话框
      setIsDeleteDialogOpen(true)
    } catch (error) {
      console.error('获取关联会话失败:', error)
      setDeleteRelatedSessions([])
      setIsDeleteDialogOpen(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!skillToDelete) return

    // 如果有关联会话，不允许删除
    if (deleteRelatedSessions.length > 0) {
      toast.error('该技能存在关联会话，无法删除。请先解除关联后再删除。')
      setIsDeleteDialogOpen(false)
      setSkillToDelete(null)
      setDeleteRelatedSessions([])
      return
    }

    try {
      await deleteSkillMutation.mutateAsync(skillToDelete.skillId)
      setIsDeleteDialogOpen(false)
      setSkillToDelete(null)
      setDeleteRelatedSessions([])
      toast.success('技能删除成功')
    } catch (error) {
      toast.error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open) {
      setSkillToDelete(null)
      setDeleteRelatedSessions([])
    }
    setIsDeleteDialogOpen(open)
  }

  const handleInstall = (skillId: string) => {
    setSkillToInstall(skillId)
    setIsInstallDialogOpen(true)
  }

  const handleInstallConfirm = async (sessionId: string) => {
    if (!skillToInstall) return

    try {
      // TODO: 调用装载技能 API
      console.log('装载技能:', skillToInstall, '到会话:', sessionId)
      alert(`技能已成功装载到会话: ${sessionId}`)
      setIsInstallDialogOpen(false)
      setSkillToInstall(null)
    } catch (error) {
      alert(`装载失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleToggleStatus = async (skillId: string, currentStatus: SkillStatus) => {
    const skill = skills.find((s) => s.skillId === skillId)
    if (!skill) return

    // 如果是禁用操作，需要检查关联会话
    if (currentStatus === SkillStatus.ACTIVE) {
      setSkillToDisable(skill)

      // 获取关联会话数据
      try {
        const sessions = await skillsApi.getSkillRelatedSessions(skillId)
        setDisableRelatedSessions(sessions)

        // 如果有关联会话，打开确认对话框
        if (sessions.length > 0) {
          setIsDisableDialogOpen(true)
          return
        }

        // 没有关联会话，直接禁用
        await performDisable(skillId)
      } catch (error) {
        console.error('获取关联会话失败:', error)
        // 出错时也直接禁用
        await performDisable(skillId)
      }
    } else {
      // 启用操作，直接执行
      await performEnable(skillId)
    }
  }

  const performDisable = async (skillId: string) => {
    try {
      await updateSkillMutation.mutateAsync({
        id: skillId,
        data: { status: SkillStatus.DISABLED },
      })
      toast.success('技能已禁用')
      setSkillToDisable(null)
      setDisableRelatedSessions([])
    } catch (error) {
      toast.error(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const performEnable = async (skillId: string) => {
    try {
      await updateSkillMutation.mutateAsync({
        id: skillId,
        data: { status: SkillStatus.ACTIVE },
      })
      toast.success('技能已启用')
    } catch (error) {
      toast.error(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleDisableConfirm = async () => {
    if (!skillToDisable) return
    await performDisable(skillToDisable.skillId)
    setIsDisableDialogOpen(false)
  }

  const handleDisableDialogOpenChange = (open: boolean) => {
    if (!open) {
      setSkillToDisable(null)
      setDisableRelatedSessions([])
    }
    setIsDisableDialogOpen(open)
  }

  const handleCreateSkill = () => {
    setIsCreateDialogOpen(true)
  }

  return (
    <>
      <div className="flex h-full flex-col">
        {/* 顶部栏 */}
        <div className="border-b bg-background px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">技能箱</h1>
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
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {skills.map((skill) => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        mode="platform-skills"
                        onViewDetails={handleViewDetails}
                        onDelete={handleDelete}
                        onInstall={handleInstall}
                        onToggleStatus={handleToggleStatus}
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

      {/* 技能详情对话框 */}
      <SkillDetailDialog
        skill={selectedSkill}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        relatedSessions={relatedSessions}
      />

      {/* 装载技能对话框 */}
      <InstallSkillDialog
        open={isInstallDialogOpen}
        onOpenChange={setIsInstallDialogOpen}
        onConfirm={handleInstallConfirm}
        sessions={mockSessions}
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

      {/* 禁用技能对话框 */}
      <DisableSkillDialog
        open={isDisableDialogOpen}
        onOpenChange={handleDisableDialogOpenChange}
        onConfirm={handleDisableConfirm}
        skillName={skillToDisable?.name || ''}
        relatedSessions={disableRelatedSessions}
        isLoading={updateSkillMutation.isPending}
      />

      {/* 删除技能对话框 */}
      <DeleteSkillDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirm={handleDeleteConfirm}
        skillName={skillToDelete?.name || ''}
        relatedSessions={deleteRelatedSessions}
        isLoading={deleteSkillMutation.isPending}
      />

      {/* 创建技能对话框 */}
      <CreateSkillDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  )
}
