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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateService } from '../../hooks/use-mcp-services';
import { Loader2 } from 'lucide-react';
import type { McpTransportType } from '../../types';

interface CreateMcpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMcpDialog({ open, onOpenChange }: CreateMcpDialogProps) {
  const [transportType, setTransportType] = useState<McpTransportType>('stdio');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    version: '',
    language: 'python',
  });

  const createMutation = useCreateService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const connectionConfig =
      transportType === 'stdio'
        ? { command: 'python', args: ['-m', 'mcp_server'] }
        : { url: 'http://localhost:3000' };

    await createMutation.mutateAsync({
      ...formData,
      transportType,
      connectionConfig,
    });

    onOpenChange(false);
    setFormData({
      name: '',
      description: '',
      icon: '',
      version: '',
      language: 'python',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建新的 MCP</DialogTitle>
          <DialogDescription>填写 MCP 服务的基本信息</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 部署方式 */}
          <div className="space-y-2">
            <Label>部署方式</Label>
            <RadioGroup
              value={transportType}
              onValueChange={(value) => setTransportType(value as McpTransportType)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stdio" id="stdio" />
                <Label htmlFor="stdio" className="cursor-pointer">
                  本地部署 (stdio)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sse" id="sse" />
                <Label htmlFor="sse" className="cursor-pointer">
                  远程连接 (SSE)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="websocket" id="websocket" />
                <Label htmlFor="websocket" className="cursor-pointer">
                  远程连接 (WebSocket)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* MCP 名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">MCP 名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：GitHub MCP"
              required
            />
          </div>

          {/* 图标 */}
          <div className="space-y-2">
            <Label htmlFor="icon">图标名称</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="例如：ChartColumn、ShieldCheck、Database"
            />
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="简要描述此 MCP 的功能"
              rows={3}
            />
          </div>

          {/* 语言类型 */}
          <div className="space-y-2">
            <Label htmlFor="language">语言类型</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => setFormData({ ...formData, language: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 版本号 */}
          <div className="space-y-2">
            <Label htmlFor="version">版本号</Label>
            <Input
              id="version"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="例如：1.0.0"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              创建
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
