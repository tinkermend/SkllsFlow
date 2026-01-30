import { apiClient } from "@/lib/api-client";
import type { McpTag } from "../types";

const BASE_URL = "/mcp";

/**
 * 获取标签列表
 */
export async function getTags(search?: string): Promise<{ data: McpTag[] }> {
  const response = await apiClient.get(`${BASE_URL}/tags`, {
    params: { search },
  });
  return response.data;
}

/**
 * 创建标签
 */
export async function createTag(data: { name: string; color?: string }) {
  const response = await apiClient.post(`${BASE_URL}/tags`, data);
  return response.data;
}
