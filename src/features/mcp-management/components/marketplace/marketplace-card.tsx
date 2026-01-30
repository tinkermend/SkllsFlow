import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, CheckCircle } from 'lucide-react';
import { LanguageIcon } from '../shared/language-icon';
import type { McpMarketplaceItem } from '../../types';

interface MarketplaceCardProps {
  item: McpMarketplaceItem;
  onLoad?: (item: McpMarketplaceItem) => void;
  onViewDetail?: (item: McpMarketplaceItem) => void;
}

export function MarketplaceCard({ item, onLoad, onViewDetail }: MarketplaceCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {item.icon ? (
              <span className="text-3xl">{item.icon}</span>
            ) : (
              <LanguageIcon />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                {item.isVerified && (
                  <CheckCircle className="h-4 w-4 text-blue-500" title="已验证" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                by {item.creatorUsername}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {item.description || '暂无描述'}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            <span>{item.installationCount} 次装载</span>
          </div>
          <Badge variant="outline">{item.categoryName}</Badge>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t flex items-center gap-2">
        <Button className="flex-1" onClick={() => onLoad?.(item)}>
          装载
        </Button>
        <Button variant="outline" onClick={() => onViewDetail?.(item)}>
          <Eye className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
