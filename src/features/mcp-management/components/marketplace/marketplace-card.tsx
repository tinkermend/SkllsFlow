import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle } from 'lucide-react';
import { LanguageIcon } from '../shared/language-icon';
import type { McpMarketplaceItem } from '../../types';

interface MarketplaceCardProps {
  item: McpMarketplaceItem;
  onLoad?: (item: McpMarketplaceItem) => void;
  onViewDetail?: (item: McpMarketplaceItem) => void;
}

export function MarketplaceCard({ item, onLoad, onViewDetail }: MarketplaceCardProps) {
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

  return (
    <Card className="hover:shadow-md transition-shadow rounded-xl border-slate-200">
      <CardHeader className="p-4 relative">
        {/* 右上角：下载次数（绝对定位） */}
        <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-slate-500">
          <Download className="h-3.5 w-3.5" />
          <span className="font-medium">{item.installationCount}</span>
        </div>

        {/* 顶部行：图标 + 名称 */}
        <div className="flex items-center gap-3 mb-2 pr-16">
          {/* 左侧图标区域 */}
          <div className={`w-14 h-14 bg-gradient-to-br ${getLanguageIconClass(item.language)} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
            {item.icon ? (
              <span>{item.icon}</span>
            ) : (
              <LanguageIcon language={item.language} />
            )}
          </div>

          {/* 名称和验证 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 text-base truncate">{item.name}</h3>
              {item.isVerified && (
                <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" title="已验证" />
              )}
            </div>
          </div>
        </div>

        {/* 描述 */}
        <p className="text-sm text-slate-600 mb-1.5 line-clamp-2 min-h-[2.5rem]">
          {item.description || '暂无描述'}
        </p>

        {/* 创建者信息 */}
        <p className="text-xs text-slate-500 mb-3">
          创建者: <span className="text-slate-700">{item.creatorUsername}</span>
        </p>

        {/* 底部行：标签和分类 + 操作按钮 */}
        <div className="flex items-center justify-between gap-3">
          {/* 左侧：标签和分类 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-2 py-1">
                    {tag}
                  </Badge>
                ))}
                {item.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    +{item.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <Badge variant="outline" className="text-xs px-2 py-1 flex-shrink-0">
              {item.categoryName}
            </Badge>
          </div>

          {/* 右下角：操作按钮 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={() => onLoad?.(item)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors h-9"
            >
              装载
            </Button>
            <Button
              variant="outline"
              onClick={() => onViewDetail?.(item)}
              className="px-4 py-2 text-xs font-medium rounded-lg h-9"
            >
              详情
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
