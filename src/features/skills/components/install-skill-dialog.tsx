import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ChatServer } from '../types'

interface InstallSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (chatServerId: string) => void
  chatServers: ChatServer[]
  isLoading?: boolean
}

export function InstallSkillDialog({
  open,
  onOpenChange,
  onConfirm,
  chatServers,
  isLoading = false,
}: InstallSkillDialogProps) {
  const [selectedChatServerId, setSelectedChatServerId] = useState<string>('')

  const handleConfirm = () => {
    if (selectedChatServerId) {
      onConfirm(selectedChatServerId)
      setSelectedChatServerId('')
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedChatServerId('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>装载技能</DialogTitle>
          <DialogDescription>
            选择要装载此技能的服务，装载后技能将部署到该服务器
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {chatServers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                您还没有创建任何服务，请先创建服务后再装载技能
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">选择服务</label>
              <Select
                value={selectedChatServerId}
                onValueChange={setSelectedChatServerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择服务" />
                </SelectTrigger>
                <SelectContent>
                  {chatServers.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedChatServerId || chatServers.length === 0 || isLoading}
          >
            {isLoading ? '装载中...' : '确认装载'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
