import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Download } from 'lucide-react'
import { parseIcon } from '@/lib/icon-parser'
import { skillsApi } from '../api/skills.api'
import { SkillStatus, type Skill, type SessionSkill, type SkillFile } from '../types'

interface SkillDetailDialogProps {
  skill: Skill | null
  open: boolean
  onOpenChange: (open: boolean) => void
  relatedSessions?: SessionSkill[]
  skillFiles?: SkillFile[]
}

export function SkillDetailDialog({
  skill,
  open,
  onOpenChange,
  relatedSessions = [],
  skillFiles = [],
}: SkillDetailDialogProps) {
  if (!skill) return null

  // 解析图标字符串为 React 组件
  const IconComponent = useMemo(() => parseIcon(skill.icon), [skill.icon])

  const statusConfig = {
    [SkillStatus.ACTIVE]: {
      label: '启用',
      variant: 'default' as const,
      className: 'bg-green-500 hover:bg-green-600',
    },
    [SkillStatus.DISABLED]: {
      label: '已禁用',
      variant: 'secondary' as const,
      className: 'bg-gray-400 hover:bg-gray-500',
    },
  }

  const config = statusConfig[skill.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Logo */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <IconComponent className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl">{skill.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  技能 ID: {skill.skillId}
                </DialogDescription>
              </div>
            </div>
            {/* 状态标签 - 增加右侧内边距避免与关闭按钮重叠 */}
            <Badge variant={config.variant} className={`${config.className} mt-1`}>
              {config.label}
            </Badge>
          </div>
        </DialogHeader>

        <Separator />

        {/* 基本信息 */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">技能描述</h3>
            <p className="text-sm text-muted-foreground">{skill.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">技能分类</h3>
              <p className="text-sm text-muted-foreground">{skill.category}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">排序值</h3>
              <p className="text-sm text-muted-foreground">{skill.sortOrder}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-2">技能标签</h3>
            <div className="flex flex-wrap gap-2">
              {skill.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-sm text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <Separator />

          {/* 创建者信息 */}
          <div>
            <h3 className="text-sm font-semibold mb-2">创建者</h3>
            <p className="text-sm text-muted-foreground">
              {skill.creatorName || '未知用户'}
            </p>
          </div>

          <Separator />

          {/* 技能文件 */}
          {skillFiles && skillFiles.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-3">技能文件 ({skillFiles.length})</h3>
                <div className="space-y-2">
                  {skillFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium truncate">{file.fileName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {(Number(file.fileSize) / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = skillsApi.downloadSkillFile(skill.skillId, file.id)
                          window.open(url, '_blank')
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        下载
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}


          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">创建时间</h3>
              <p className="text-sm text-muted-foreground">{skill.createdAt}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">更新时间</h3>
              <p className="text-sm text-muted-foreground">{skill.updatedAt}</p>
            </div>
          </div>

          {/* 关联会话列表 */}
          {relatedSessions.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  关联会话 ({relatedSessions.length})
                </h3>
                <div className="space-y-2">
                  {relatedSessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{session.sessionTitle}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {session.sessionId}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
