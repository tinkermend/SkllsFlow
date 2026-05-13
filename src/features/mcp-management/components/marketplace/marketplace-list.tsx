import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useMarketplaceList } from '../../hooks/use-mcp-marketplace';
import { MarketplaceCard } from './marketplace-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { McpMarketplaceItem } from '../../types';

interface MarketplaceListProps {
  categoryId?: string;
  onLoad?: (item: McpMarketplaceItem) => void;
  onViewDetail?: (item: McpMarketplaceItem) => void;
}

export function MarketplaceList({ categoryId, onLoad, onViewDetail }: MarketplaceListProps) {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useMarketplaceList({
    search,
    categoryId,
    sortBy: 'installationCount',
    sortOrder: 'desc',
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[252px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const items = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索 MCP 市场"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          没有找到匹配的 MCP 服务
        </div>
      ) : (
        <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((item) => (
            <MarketplaceCard
              key={item.id}
              item={item}
              onLoad={onLoad}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
