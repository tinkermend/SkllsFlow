import { Loader2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { LoadedServer } from '../types'
import { Progress } from '@/components/ui/progress'

interface DeleteSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  skillName: string
  loadedServers?: LoadedServer[]
  isLoading?: boolean
  unloadProgress?: {
    current: number
    total: number
    serverName: string
  } | null
}

export function DeleteSkillDialog({
  open,
  onOpenChange,
  onConfirm,
  skillName,
  loadedServers = [],
  isLoading = false,
  unloadProgress = null,
}: DeleteSkillDialogProps) {
  const progressPercentage = unloadProgress
    ? (unloadProgress.current / unloadProgress.total) * 100
    : 0

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="删除技能"
      desc={
        <div className="space-y-3">
          <p>确定要删除技能 <span className="font-semibold">"{skillName}"</span> 吗？</p>
          <p className="text-sm text-destructive font-medium">删除后将无法恢复</p>

          {/* 如果有装载的服务器，显示警告和卸载进度 */}
          {loadedServers.length > 0 ? (
            <div className="rounded-lg border bg-yellow-50 dark:bg-yellow-950/20 p-3">
              <p className="text-sm font-medium mb-2 text-yellow-800 dark:text-yellow-300">
                ⚠️ 该技能当前已装载到 {loadedServers.length} 个服务
              </p>
              <div className="space-y-1.5 mb-2">
                {loadedServers.map((server) => (
                  <div key={server.chatServerId} className="flex items-center justify-between text-xs">
                    <span className="font-medium">{server.chatServerName}</span>
                    <span className="text-muted-foreground font-mono">
                      {server.proxyHost}:{server.openCodePort}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                删除时将自动从这些服务中卸载该技能
              </p>

              {/* 卸载进度 */}
              {unloadProgress && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      正在卸载: {unloadProgress.serverName}
                    </span>
                    <span className="font-medium">
                      {unloadProgress.current} / {unloadProgress.total}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              删除后，该技能将从平台技能库中永久移除。
            </p>
          )}
        </div>
      }
      cancelBtnText="取消"
      confirmText={
        isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {unloadProgress ? '卸载中...' : '删除中...'}
          </span>
        ) : (
          "确认删除"
        )
      }
      destructive={true}
      handleConfirm={onConfirm}
      isLoading={isLoading}
      disabled={isLoading}
    />
  )
}
