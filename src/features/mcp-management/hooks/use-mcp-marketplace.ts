import { useQuery } from '@tanstack/react-query';
import * as mcpMarketplaceApi from '../api/mcp-marketplace.api';
import type { McpQueryOptions } from '../types';

/**
 * 获取 MCP 市场列表
 */
export function useMarketplaceList(options?: McpQueryOptions) {
  return useQuery({
    queryKey: ['mcp-marketplace', options],
    queryFn: () => mcpMarketplaceApi.getMarketplaceList(options),
  });
}
