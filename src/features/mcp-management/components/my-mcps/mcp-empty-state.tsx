import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

interface McpEmptyStateProps {
  onGoToMarketplace?: () => void;
}

export function McpEmptyState({ onGoToMarketplace }: McpEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">还没有 MCP 服务</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        您还没有创建或安装任何 MCP 服务。去 MCP 市场看看，或者创建一个新的 MCP 服务。
      </p>
      <Button onClick={onGoToMarketplace}>去 MCP 市场看看</Button>
    </div>
  );
}
