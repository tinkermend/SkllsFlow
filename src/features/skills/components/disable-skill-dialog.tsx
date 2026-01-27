import { Loader2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { SessionSkill } from '../types'

interface DisableSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  skillName: string
  relatedSessions?: SessionSkill[]
  isLoading?: boolean
}

export function DisableSkillDialog({
  open,
  onOpenChange,
  onConfirm,
  skillName,
  relatedSessions = [],
  isLoading = false,
}: DisableSkillDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="禁用技能"
      desc={
        <div className="space-y-3">
          <p>确定要禁用技能 <span className="font-semibold">"{skillName}"</span> 吗？</p>

          {/* 如果有关联会话，显示警告 */}
          {relatedSessions.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                禁用后，该技能将无法被装载到新的会话中。
              </p>
              <div className="rounded-lg border bg-orange-50 dark:bg-orange-950/20 p-3">
                <p className="text-sm font-medium mb-2 text-orange-800 dark:text-orange-300">
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
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  禁用后，这些会话将无法继续使用此技能
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              禁用后，该技能将无法被装载到新的会话中。
            </p>
          )}
        </div>
      }
      cancelBtnText="取消"
      confirmText={isLoading ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> 禁用中...</span> : "确认禁用"}
      destructive={true}
      handleConfirm={onConfirm}
      isLoading={isLoading}
      disabled={isLoading}
    />
  )
}
