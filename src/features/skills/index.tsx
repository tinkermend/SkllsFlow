import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SkillCard } from './components/skill-card'
import { useSkills, useDeleteSkill } from './hooks/use-skills'
import type { SkillTab } from './types'

export function Skills() {
  const [activeTab, setActiveTab] = useState<SkillTab>('my-skills')

  // 获取技能列表
  const { data: skills = [], isLoading, error } = useSkills()

  // 删除技能
  const deleteSkillMutation = useDeleteSkill()

  const handleViewDetails = (_skillId: string) => {
    // TODO: 实现查看详情功能
    alert('功能开发中：查看详情功能即将推出')
  }

  const handleUninstall = async (skillId: string) => {
    if (!confirm('确定要卸载这个技能吗？')) {
      return
    }

    try {
      await deleteSkillMutation.mutateAsync(skillId)
      alert('卸载成功')
    } catch (error) {
      alert(`卸载失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleCreateSkill = () => {
    // TODO: 实现创建技能功能
    alert('功能开发中：创建技能功能即将推出')
  }

  return (
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
          <Button onClick={handleCreateSkill} className="gap-2">
            <Plus className="h-4 w-4" />
            创建技能
          </Button>
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
                    <Button onClick={handleCreateSkill} variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      创建第一个技能
                    </Button>
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
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  平台技能功能即将推出...
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}
