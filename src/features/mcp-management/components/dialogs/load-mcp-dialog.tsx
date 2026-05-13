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
import { useActiveChatServers } from '@/features/skills/hooks/use-skills';
import { Loader2, Server } from 'lucide-react';
import { useLoadToChatServers } from '../../hooks/use-mcp-operations';

interface LoadMcpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mcpId: string;
  mcpName: string;
}

export function LoadMcpDialog({ open, onOpenChange, mcpId, mcpName }: LoadMcpDialogProps) {
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const { data: chatServers = [], isLoading } = useActiveChatServers();
  const loadMutation = useLoadToChatServers();

  const handleToggleChatServer = (chatId: string) => {
    setSelectedChatIds((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleLoad = async () => {
    if (selectedChatIds.length === 0) return;

    await loadMutation.mutateAsync({
      mcpId,
      chatIds: selectedChatIds,
    });

    onOpenChange(false);
    setSelectedChatIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>装载 MCP 到智能服务</DialogTitle>
          <DialogDescription>
            选择要装载 <strong>{mcpName}</strong> 的智能服务
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              加载智能服务...
            </div>
          ) : chatServers.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              <Server className="mx-auto mb-2 h-8 w-8 opacity-50" />
              暂无可装载的活跃智能服务
            </div>
          ) : (
            chatServers.map((server) => (
              <div key={server.chatId} className="flex items-center space-x-2">
                <Checkbox
                  id={server.chatId}
                  checked={selectedChatIds.includes(server.chatId)}
                  onCheckedChange={() => handleToggleChatServer(server.chatId)}
                />
                <Label htmlFor={server.chatId} className="cursor-pointer flex-1">
                  {server.name}
                </Label>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleLoad}
            disabled={selectedChatIds.length === 0 || loadMutation.isPending}
          >
            {loadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            装载
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
