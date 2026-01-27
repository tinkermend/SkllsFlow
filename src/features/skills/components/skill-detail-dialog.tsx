import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { SkillStatus, type Skill, type SessionSkill } from '../types'

interface SkillDetailDialogProps {
  skill: Skill | null
  open: boolean
  onOpenChange: (open: boolean) => void
  relatedSessions?: SessionSkill[]
}

export function SkillDetailDialog({
  skill,
  open,
  onOpenChange,
  relatedSessions = [],
}: SkillDetailDialogProps) {
  if (!skill) return null

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
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Logo */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-3xl">
                {skill.iconPath}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl">{skill.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  技能 ID: {skill.skillId}
                </DialogDescription>
              </div>
            </div>
            {/* 状态标签 */}
            <Badge variant={config.variant} className={config.className}>
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

          <div>
            <h3 className="text-sm font-semibold mb-2">文件路径</h3>
            <p className="text-sm text-muted-foreground font-mono break-all">
              {skill.filePath}
            </p>
          </div>

          <Separator />

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
