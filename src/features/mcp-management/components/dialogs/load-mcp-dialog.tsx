import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLoadToSessions } from '../../hooks/use-mcp-operations';
import { Loader2 } from 'lucide-react';

interface LoadMcpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mcpId: string;
  mcpName: string;
}

// 模拟会话数据（实际应该从 API 获取）
const mockSessions = [
  { id: 'sess_1', sessionId: 'sess_1', title: '项目开发会话' },
  { id: 'sess_2', sessionId: 'sess_2', title: '代码审查会话' },
  { id: 'sess_3', sessionId: 'sess_3', title: '测试会话' },
];

export function LoadMcpDialog({ open, onOpenChange, mcpId, mcpName }: LoadMcpDialogProps) {
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const loadMutation = useLoadToSessions();

  const handleToggleSession = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleLoad = async () => {
    if (selectedSessions.length === 0) return;

    await loadMutation.mutateAsync({
      mcpId,
      sessionIds: selectedSessions,
    });

    onOpenChange(false);
    setSelectedSessions([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>装载 MCP 到会话</DialogTitle>
          <DialogDescription>
            选择要装载 <strong>{mcpName}</strong> 的会话
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {mockSessions.map((session) => (
            <div key={session.id} className="flex items-center space-x-2">
              <Checkbox
                id={session.id}
                checked={selectedSessions.includes(session.sessionId)}
                onCheckedChange={() => handleToggleSession(session.sessionId)}
              />
              <Label htmlFor={session.id} className="cursor-pointer flex-1">
                {session.title}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleLoad}
            disabled={selectedSessions.length === 0 || loadMutation.isPending}
          >
            {loadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            装载
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
