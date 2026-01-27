import { Loader2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { SessionSkill } from '../types'

interface UninstallSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  skillName: string
  relatedSessions?: SessionSkill[]
  isLoading?: boolean
}

export function UninstallSkillDialog({
  open,
  onOpenChange,
  onConfirm,
  skillName,
  relatedSessions = [],
  isLoading = false,
}: UninstallSkillDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="卸载技能"
      desc={
        <div className="space-y-3">
          <p>确定要卸载技能 <span className="font-semibold">"{skillName}"</span> 吗？</p>
          <p className="text-sm text-muted-foreground">卸载后，该技能将从"我的技能"列表中移除。</p>

          {/* 关联会话信息 */}
          {relatedSessions.length > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm font-medium mb-2">该技能关联的会话 ({relatedSessions.length})</p>
              <div className="space-y-1.5">
                {relatedSessions.map((session) => (
                  <div key={session.sessionId} className="flex items-center justify-between text-xs">
                    <span className="font-medium">{session.sessionTitle}</span>
                    <span className="text-muted-foreground font-mono">{session.sessionId}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                ⚠️ 卸载后，这些会话将无法继续使用此技能
              </p>
            </div>
          )}
        </div>
      }
      cancelBtnText="取消"
      confirmText={isLoading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> 卸载中...</span> : "确认卸载"}
      destructive={true}
      handleConfirm={onConfirm}
      isLoading={isLoading}
      disabled={isLoading}
    />
  )
}
