import { useQuery } from '@tanstack/react-query';
import * as mcpCategoriesApi from '../api/mcp-categories.api';

/**
 * 获取分类列表
 */
export function useCategories() {
  return useQuery({
    queryKey: ['mcp-categories'],
    queryFn: () => mcpCategoriesApi.getCategories(),
  });
}
