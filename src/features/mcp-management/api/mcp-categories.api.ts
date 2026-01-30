import { apiClient } from "@/lib/api-client";
import type { McpCategory } from "../types";

const BASE_URL = "/mcp";

/**
 * 获取分类列表
 */
export async function getCategories(): Promise<{ data: McpCategory[] }> {
  const response = await apiClient.get(`${BASE_URL}/categories`);
  return response.data;
}
