import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle } from 'lucide-react';
import { parseIcon } from '@/lib/icon-parser';
import { LanguageIcon } from '../shared/language-icon';
import type { McpMarketplaceItem } from '../../types';

interface MarketplaceCardProps {
  item: McpMarketplaceItem;
  onLoad?: (item: McpMarketplaceItem) => void;
  onViewDetail?: (item: McpMarketplaceItem) => void;
}

export function MarketplaceCard({ item, onLoad, onViewDetail }: MarketplaceCardProps) {
  const visibleTags = item.tags.slice(0, 3);
  const hiddenTagCount = Math.max(item.tags.length - 3, 0);
  const MarketplaceIcon = item.icon ? parseIcon(item.icon) : null;

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
    <Card className="flex h-full flex-col gap-0 rounded-xl border-slate-200 py-0 transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-3 p-4 pb-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl ${getLanguageIconClass(item.language)}`}
          >
            {MarketplaceIcon ? (
              <MarketplaceIcon className="h-6 w-6 text-slate-700" />
            ) : (
              <LanguageIcon language={item.language} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900">{item.name}</h3>
              {item.isVerified && (
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-blue-500" />
              )}
            </div>
            <p className="mt-1 truncate text-xs text-slate-500">
              创建者: <span className="text-slate-700">{item.creatorUsername}</span>
            </p>
          </div>
        </div>

        <Badge variant="secondary" className="flex shrink-0 items-center gap-1 text-xs font-medium">
          <Download className="h-3.5 w-3.5" />
          <span>{item.installationCount}</span>
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-4 pb-3 pt-0">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-slate-600">
          {item.description || '暂无描述'}
        </p>

        <div className="mt-3 h-12 overflow-hidden">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
              {item.categoryName}
            </Badge>

            {visibleTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-xs">
                {tag}
              </Badge>
            ))}

            {hiddenTagCount > 0 && (
              <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                +{hiddenTagCount}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto justify-end gap-2 border-t border-slate-100 px-4 pb-4 pt-3">
        <Button
          size="sm"
          onClick={() => onLoad?.(item)}
          className="min-w-[68px] bg-blue-600 text-white hover:bg-blue-700"
        >
          装载
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDetail?.(item)}
          className="min-w-[68px]"
        >
          详情
        </Button>
      </CardFooter>
    </Card>
  );
}
