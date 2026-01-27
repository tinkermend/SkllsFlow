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

interface Session {
  id: string
  name: string
}

interface InstallSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (sessionId: string) => void
  sessions: Session[]
  isLoading?: boolean
}

export function InstallSkillDialog({
  open,
  onOpenChange,
  onConfirm,
  sessions,
  isLoading = false,
}: InstallSkillDialogProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')

  const handleConfirm = () => {
    if (selectedSessionId) {
      onConfirm(selectedSessionId)
      setSelectedSessionId('')
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedSessionId('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>装载技能</DialogTitle>
          <DialogDescription>
            选择要装载此技能的会话，装载后可在"我的技能"中查看
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {sessions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                您还没有创建任何会话，请先创建会话后再装载技能
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">选择会话</label>
              <Select
                value={selectedSessionId}
                onValueChange={setSelectedSessionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择会话" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
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
            disabled={!selectedSessionId || sessions.length === 0 || isLoading}
          >
            {isLoading ? '装载中...' : '确认装载'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
