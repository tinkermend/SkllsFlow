import { useEffect, useMemo, useState } from 'react';
import { useMyServices } from '../../hooks/use-mcp-services';
import { McpSearchBar } from './mcp-search-bar';
import { McpCard } from './mcp-card';
import { McpEmptyState } from './mcp-empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { McpService } from '../../types';

interface MyMcpsListProps {
  onGoToMarketplace?: () => void;
  onConfigure?: (service: McpService) => void;
  onRestart?: (service: McpService) => void;
  onAddToSession?: (service: McpService) => void;
  onDelete?: (service: McpService) => void;
  onActiveServiceChange?: (service: McpService | null) => void;
}

export function MyMcpsList({
  onGoToMarketplace,
  onConfigure,
  onRestart,
  onAddToSession,
  onDelete,
  onActiveServiceChange,
}: MyMcpsListProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);

  const { data, isLoading } = useMyServices({
    search,
    sortBy,
    sortOrder: 'desc',
  });

  const services = useMemo(() => data?.data ?? [], [data?.data]);

  useEffect(() => {
    if (!activeServiceId) return;

    const hasActiveService = services.some((service) => service.id === activeServiceId);
    if (!hasActiveService) {
      // Active selection mirrors the fetched service list and must be cleared
      // when the backing service disappears.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveServiceId(null);
      onActiveServiceChange?.(null);
    }
  }, [services, activeServiceId, onActiveServiceChange]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <McpSearchBar
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0 && !search) {
    return <McpEmptyState onGoToMarketplace={onGoToMarketplace} />;
  }

  const handleSelectService = (service: McpService) => {
    setActiveServiceId(service.id);
    onActiveServiceChange?.(service);
  };

  return (
    <div className="space-y-4">
      <McpSearchBar
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {services.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          没有找到匹配的 MCP 服务
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {services.map((service) => (
            <McpCard
              key={service.id}
              service={service}
              onConfigure={onConfigure}
              onRestart={onRestart}
              onAddToSession={onAddToSession}
              onDelete={onDelete}
              isActive={service.id === activeServiceId}
              onSelect={handleSelectService}
            />
          ))}
        </div>
      )}
    </div>
  );
}
