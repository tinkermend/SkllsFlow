import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';
import type { McpStatus } from '../../types';

interface HealthStatusBadgeProps {
  status: McpStatus;
}

const statusConfig = {
  active: {
    label: '运行中',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  inactive: {
    label: '已停止',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
  },
  error: {
    label: '异常',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  maintenance: {
    label: '维护中',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
};

export function HealthStatusBadge({ status }: HealthStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={`${config.bgColor} border-0`}>
      <Circle className={`h-2 w-2 mr-1 fill-current ${config.color}`} />
      <span className={config.color}>{config.label}</span>
    </Badge>
  );
}
