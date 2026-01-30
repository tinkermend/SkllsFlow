import { Badge } from '@/components/ui/badge';
import type { McpTransportType } from '../../types';

interface DeploymentBadgeProps {
  transportType: McpTransportType;
}

const transportConfig = {
  stdio: {
    label: '本地',
    variant: 'default' as const,
  },
  sse: {
    label: '远程 SSE',
    variant: 'secondary' as const,
  },
  websocket: {
    label: '远程 WS',
    variant: 'secondary' as const,
  },
};

export function DeploymentBadge({ transportType }: DeploymentBadgeProps) {
  const config = transportConfig[transportType];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
