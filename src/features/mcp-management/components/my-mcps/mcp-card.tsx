import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Settings, RotateCw, Trash2, Link as LinkIcon } from 'lucide-react';
import { HealthStatusBadge } from '../shared/health-status-badge';
import { DeploymentBadge } from '../shared/deployment-badge';
import { LanguageIcon } from '../shared/language-icon';
import type { McpService } from '../../types';

interface McpCardProps {
  service: McpService;
  onConfigure?: (service: McpService) => void;
  onRestart?: (service: McpService) => void;
  onAddToSession?: (service: McpService) => void;
  onDelete?: (service: McpService) => void;
}

export function McpCard({
  service,
  onConfigure,
  onRestart,
  onAddToSession,
  onDelete,
}: McpCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {service.icon ? (
              <span className="text-3xl">{service.icon}</span>
            ) : (
              <LanguageIcon language={service.language} />
            )}
            <div>
              <h3 className="font-semibold text-lg">{service.name}</h3>
              {service.version && (
                <span className="text-xs text-muted-foreground">v{service.version}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HealthStatusBadge status={service.status} />
            <DeploymentBadge transportType={service.transportType} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {service.description || '暂无描述'}
        </p>

        <div className="space-y-1 text-xs text-muted-foreground">
          {service.language && (
            <div>
              <span className="font-medium">语言：</span>
              {service.language}
            </div>
          )}
          {service.createdByUser && (
            <div>
              <span className="font-medium">创建人：</span>
              {service.createdByUser.username}
            </div>
          )}
          <div>
            <span className="font-medium">创建时间：</span>
            {new Date(service.createdAt).toLocaleDateString('zh-CN')}
          </div>
        </div>

        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {service.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => onConfigure?.(service)}>
          <Settings className="h-3 w-3 mr-1" />
          配置
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRestart?.(service)}>
              <RotateCw className="h-4 w-4 mr-2" />
              重启服务
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddToSession?.(service)}>
              <LinkIcon className="h-4 w-4 mr-2" />
              添加到会话
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(service)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              卸载
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
