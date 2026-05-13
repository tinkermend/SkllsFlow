import { useState } from 'react';
import { CategorySidebar } from './category-sidebar';
import { MarketplaceList } from './marketplace-list';
import type { McpMarketplaceItem } from '../../types';

interface MarketplaceLayoutProps {
  onLoad?: (item: McpMarketplaceItem) => void;
  onViewDetail?: (item: McpMarketplaceItem) => void;
}

export function MarketplaceLayout({ onLoad, onViewDetail }: MarketplaceLayoutProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* 左侧分类侧边栏 */}
      <div className="lg:w-64 lg:flex-shrink-0">
        <div className="sticky top-6">
          <h3 className="font-semibold mb-3">分类</h3>
          <CategorySidebar
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={setSelectedCategoryId}
          />
        </div>
      </div>

      {/* 右侧市场列表 */}
      <div className="min-w-0 flex-1">
        <MarketplaceList
          categoryId={selectedCategoryId}
          onLoad={onLoad}
          onViewDetail={onViewDetail}
        />
      </div>
    </div>
  );
}
