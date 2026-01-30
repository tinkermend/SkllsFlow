import { apiClient } from "@/lib/api-client";
import type { McpMarketplaceResponse, McpQueryOptions } from "../types";

const BASE_URL = "/mcp";

/**
 * 获取 MCP 市场列表
 */
export async function getMarketplaceList(
  options?: McpQueryOptions,
): Promise<McpMarketplaceResponse> {
  const response = await apiClient.get(`${BASE_URL}/marketplace`, {
    params: options,
  });
  return response.data;
}
