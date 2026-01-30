import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '../../hooks/use-mcp-categories';
import { Skeleton } from '@/components/ui/skeleton';

interface CategorySidebarProps {
  selectedCategoryId?: string;
  onCategorySelect: (categoryId?: string) => void;
}

export function CategorySidebar({
  selectedCategoryId,
  onCategorySelect,
}: CategorySidebarProps) {
  const { data, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const categories = data?.data || [];

  return (
    <div className="space-y-1">
      <Button
        variant={!selectedCategoryId ? 'secondary' : 'ghost'}
        className="w-full justify-start"
        onClick={() => onCategorySelect(undefined)}
      >
        全部
      </Button>

      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategoryId === category.id ? 'secondary' : 'ghost'}
          className="w-full justify-between"
          onClick={() => onCategorySelect(category.id)}
        >
          <span>{category.name}</span>
          {category.mcpCount !== undefined && (
            <Badge variant="outline" className="ml-2">
              {category.mcpCount}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
}
