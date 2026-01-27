import { Loader2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { SessionSkill } from '../types'

interface DeleteSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  skillName: string
  relatedSessions?: SessionSkill[]
  isLoading?: boolean
}

export function DeleteSkillDialog({
  open,
  onOpenChange,
  onConfirm,
  skillName,
  relatedSessions = [],
  isLoading = false,
}: DeleteSkillDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="删除技能"
      desc={
        <div className="space-y-3">
          <p>确定要删除技能 <span className="font-semibold">"{skillName}"</span> 吗？</p>
          <p className="text-sm text-destructive font-medium">删除后将无法恢复</p>

          {/* 如果有关联会话，显示警告 */}
          {relatedSessions.length > 0 ? (
            <div className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-3">
              <p className="text-sm font-medium mb-2 text-red-800 dark:text-red-300">
                ⚠️ 该技能当前已装载到 {relatedSessions.length} 个会话
              </p>
              <div className="space-y-1.5 mb-2">
                {relatedSessions.map((session) => (
                  <div key={session.sessionId} className="flex items-center justify-between text-xs">
                    <span className="font-medium">{session.sessionTitle}</span>
                    <span className="text-muted-foreground font-mono">{session.sessionId}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-700 dark:text-red-400">
                删除前，请先解除这些会话的关联
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              删除后，该技能将从平台技能库中永久移除。
            </p>
          )}
        </div>
      }
      cancelBtnText="取消"
      confirmText={isLoading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> 删除中...</span> : "确认删除"}
      destructive={true}
      handleConfirm={onConfirm}
      isLoading={isLoading}
      disabled={isLoading || relatedSessions.length > 0}
    />
  )
}
