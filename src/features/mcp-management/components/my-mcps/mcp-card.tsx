import { type KeyboardEvent } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Settings, RotateCw, Trash2, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageIcon } from '../shared/language-icon';
import type { McpService, McpStatus } from '../../types';

interface McpCardProps {
  service: McpService;
  onConfigure?: (service: McpService) => void;
  onRestart?: (service: McpService) => void;
  onAddToSession?: (service: McpService) => void;
  onDelete?: (service: McpService) => void;
  isActive?: boolean;
  onSelect?: (service: McpService) => void;
}

// 获取状态样式
const getStatusDotClass = (status: McpStatus) => {
  const classes: Record<McpStatus, string> = {
    active: 'bg-green-500 status-healthy',
    error: 'bg-red-500 status-unhealthy',
    inactive: 'bg-slate-400 status-offline',
    maintenance: 'bg-amber-500 status-connecting',
  };
  return classes[status] || 'bg-slate-400';
};

// 获取语言图标类名（用于渐变背景）
const getLanguageIconClass = (language?: string) => {
  const classes: Record<string, string> = {
    'python': 'from-blue-100 to-blue-200',
    'nodejs': 'from-green-100 to-green-200',
    'go': 'from-cyan-100 to-cyan-200',
    'javascript': 'from-yellow-100 to-yellow-200',
    'typescript': 'from-blue-100 to-indigo-200',
  };
  return classes[language?.toLowerCase() || ''] || 'from-slate-100 to-slate-200';
};

// 获取部署类型颜色和文本
const getDeploymentInfo = (transportType: McpService['transportType']) => {
  const info: Record<typeof transportType, { color: string; text: string }> = {
    stdio: { color: 'bg-slate-100 text-slate-600', text: '本地' },
    sse: { color: 'bg-blue-50 text-blue-600', text: '远程' },
    websocket: { color: 'bg-blue-50 text-blue-600', text: '远程' },
  };
  return info[transportType] || { color: 'bg-slate-100 text-slate-600', text: '远程' };
};

export function McpCard({
  service,
  onConfigure,
  onRestart,
  onAddToSession,
  onDelete,
  isActive = false,
  onSelect,
}: McpCardProps) {
  const deploymentInfo = getDeploymentInfo(service.transportType);
  const handleSelect = () => {
    onSelect?.(service);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(service);
    }
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200 rounded-xl border-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
        isActive
          ? 'bg-primary/5 border-primary/60 shadow-lg ring-1 ring-primary/25 scale-[1.01]'
          : 'opacity-60 hover:opacity-100 hover:shadow-md hover:border-slate-300'
      )}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="p-5">
        <div className="flex items-start gap-4">
          {/* 左侧图标区域 */}
          <div className={`w-12 h-12 bg-gradient-to-br ${getLanguageIconClass(service.language)} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
            {service.icon ? (
              <span>{service.icon}</span>
            ) : (
              <LanguageIcon language={service.language} />
            )}
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-slate-900">{service.name}</h3>
                  <span className={`px-2 py-1 ${deploymentInfo.color} text-xs rounded-full`}>
                    {deploymentInfo.text}
                  </span>
                  {isActive && (
                    <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
                      当前激活
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${getStatusDotClass(service.status)}`}></span>
                    <span className="text-xs text-slate-500">
                      {service.status === 'active' ? '运行中' :
                       service.status === 'error' ? '异常' :
                       service.status === 'maintenance' ? '维护中' : '停止'}
                    </span>
                  </div>
                  {service.version && (
                    <span className="text-xs text-slate-500">v{service.version}</span>
                  )}
                </div>
              </div>
            </div>

            {/* 描述 */}
            <p className="text-sm text-slate-600 line-clamp-2 mb-4">
              {service.description || '暂无描述'}
            </p>

            {/* 元信息 */}
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
              {service.language && (
                <span className="flex items-center gap-1">
                  <i className={`fab fa-${service.language === 'nodejs' ? 'js' : service.language?.toLowerCase()}`}></i>
                  {service.language}
                </span>
              )}
              {service.createdByUser && (
                <span>创建人: {service.createdByUser.username}</span>
              )}
              <span>{new Date(service.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>

            {/* 标签和操作 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {/* 标签展示 */}
              {service.tags && service.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {service.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-2 py-1">
                      {tag}
                    </Badge>
                  ))}
                  {service.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      +{service.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onConfigure?.(service)}
                  className="px-3 py-2 text-sm"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  配置
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="px-3 py-2 text-sm">
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
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
